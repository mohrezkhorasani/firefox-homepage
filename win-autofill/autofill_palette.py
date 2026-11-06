"""
Mohrez Windows Quick Autofill Palette
Floating quick picker for Windows (like Win+V but for your saved Autofill items).
Listens to global hotkeys:
  - Alt + V (Default, closest to Win+V)
  - Ctrl + Alt + V
  - Alt + ` (Backtick)
Reads from central F:\\tools\\win-agent\\autofill_data.json and types/pastes into the active window.
"""

import os
import sys
import json
import time
import threading
import tkinter as tk
from tkinter import ttk
import ctypes
from ctypes import wintypes
import urllib.request

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

# Configure ctypes prototypes for clipboard & keyboard simulation
kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
kernel32.GlobalAlloc.restype = wintypes.HGLOBAL
kernel32.GlobalLock.argtypes = [wintypes.HGLOBAL]
kernel32.GlobalLock.restype = wintypes.LPVOID
kernel32.GlobalUnlock.argtypes = [wintypes.HGLOBAL]
kernel32.GlobalUnlock.restype = wintypes.BOOL
user32.SetClipboardData.argtypes = [wintypes.UINT, wintypes.HANDLE]
user32.SetClipboardData.restype = wintypes.HANDLE

class POINT(ctypes.Structure):
    _fields_ = [('x', ctypes.c_long), ('y', ctypes.c_long)]

MOD_ALT = 0x0001
MOD_CONTROL = 0x0002
MOD_SHIFT = 0x0004
MOD_WIN = 0x0008

VK_V = 0x56
VK_OEM_3 = 0xC0  # ` (Backtick)

HOTKEY_ID_ALTV = 101
HOTKEY_ID_CTRLALTV = 102
HOTKEY_ID_ALTBACKTICK = 103

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'win-agent', 'autofill_data.json')

def get_mouse_pos():
    pt = POINT()
    user32.GetCursorPos(ctypes.byref(pt))
    return pt.x, pt.y

def set_clipboard(text):
    if not user32.OpenClipboard(None):
        return False
    user32.EmptyClipboard()
    encoded = (text + '\0').encode('utf-16le')
    hMem = kernel32.GlobalAlloc(0x0042, len(encoded))
    pMem = kernel32.GlobalLock(hMem)
    ctypes.memmove(pMem, encoded, len(encoded))
    kernel32.GlobalUnlock(hMem)
    user32.SetClipboardData(13, hMem)  # CF_UNICODETEXT = 13
    user32.CloseClipboard()
    return True

def paste_clipboard(prev_hwnd=None):
    if prev_hwnd and user32.IsWindow(prev_hwnd):
        user32.SetForegroundWindow(prev_hwnd)
        time.sleep(0.06)

    # Simulate Ctrl+V
    KEYEVENTF_KEYUP = 0x0002
    VK_CONTROL = 0x11
    VK_V = 0x56

    user32.keybd_event(VK_CONTROL, 0, 0, 0)
    user32.keybd_event(VK_V, 0, 0, 0)
    user32.keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0)
    user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)

def load_items():
    # 1. Try agent API first
    try:
        req = urllib.request.Request('http://127.0.0.1:23157/api/autofill')
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(req, timeout=1) as r:
            data = json.loads(r.read().decode('utf-8'))
            if data.get('ok') and isinstance(data.get('items'), list):
                return data['items']
    except Exception:
        pass

    # 2. Fallback to direct file
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                d = json.load(f)
                if isinstance(d, list):
                    return d
        except Exception:
            pass
    return []

class AutofillPalette:
    def __init__(self):
        self.root = None
        self.prev_hwnd = None
        self.items = []
        self.filtered_items = []
        self.selected_index = 0
        self.search_var = None
        self.is_visible = False

    def build_gui(self):
        self.root = tk.Tk()
        self.root.title("Mohrez Quick Autofill")
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)
        self.root.configure(bg="#0f172a")

        # Outer border
        outer = tk.Frame(self.root, bg="#334155", padx=1, pady=1)
        outer.pack(fill="both", expand=True)

        inner = tk.Frame(outer, bg="#0f172a", padx=12, pady=10)
        inner.pack(fill="both", expand=True)

        # Header
        hdr = tk.Frame(inner, bg="#0f172a")
        hdr.pack(fill="x", pady=(0, 8))

        lbl_title = tk.Label(
            hdr, text="⚡ Mohrez Autofill",
            font=("Segoe UI", 10, "bold"), fg="#818cf8", bg="#0f172a"
        )
        lbl_title.pack(side="left")

        lbl_esc = tk.Label(
            hdr, text="Alt+V | Esc برای بستن",
            font=("Segoe UI", 8), fg="#64748b", bg="#0f172a"
        )
        lbl_esc.pack(side="right")

        # Search Entry
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *args: self.on_search_change())

        search_frame = tk.Frame(inner, bg="#1e293b", padx=6, pady=4, highlightthickness=1, highlightbackground="#475569")
        search_frame.pack(fill="x", pady=(0, 8))

        self.entry = tk.Entry(
            search_frame, textvariable=self.search_var,
            font=("Segoe UI", 10), fg="#ffffff", bg="#1e293b",
            insertbackground="#ffffff", borderwidth=0, relief="flat"
        )
        self.entry.pack(fill="x")

        # List Container
        self.list_frame = tk.Frame(inner, bg="#0f172a")
        self.list_frame.pack(fill="both", expand=True)

        # Keyboard bindings
        self.root.bind("<Escape>", lambda e: self.hide())
        self.root.bind("<Down>", lambda e: self.move_selection(1))
        self.root.bind("<Up>", lambda e: self.move_selection(-1))
        self.root.bind("<Return>", lambda e: self.choose_selected())
        self.root.bind("<FocusOut>", self.on_focus_out)

        self.root.withdraw()

    def on_focus_out(self, event):
        # Auto-hide if window loses focus
        if self.is_visible:
            self.root.after(150, self.check_and_hide_if_inactive)

    def check_and_hide_if_inactive(self):
        fg = user32.GetForegroundWindow()
        own_hwnd = self.root.winfo_id()
        if fg != own_hwnd and self.is_visible:
            self.hide()

    def show(self, prev_hwnd):
        self.prev_hwnd = prev_hwnd
        self.items = load_items()
        self.search_var.set("")
        self.selected_index = 0
        self.filter_and_render()

        # Position near mouse cursor or centered nicely
        mx, my = get_mouse_pos()
        width = 340
        height = 360

        # Screen bounds check
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()

        x = mx + 10
        y = my + 10

        if x + width > screen_w - 20:
            x = mx - width - 10
        if y + height > screen_h - 40:
            y = my - height - 10

        x = max(10, min(x, screen_w - width - 10))
        y = max(10, min(y, screen_h - height - 10))

        self.root.geometry(f"{width}x{height}+{x}+{y}")
        self.root.deiconify()
        self.root.lift()
        self.root.focus_force()
        self.entry.focus_set()
        self.is_visible = True

    def hide(self):
        if self.root:
            self.root.withdraw()
        self.is_visible = False

    def toggle(self, prev_hwnd):
        if self.is_visible:
            self.hide()
        else:
            self.show(prev_hwnd)

    def on_search_change(self):
        self.selected_index = 0
        self.filter_and_render()

    def filter_and_render(self):
        q = (self.search_var.get() or "").lower().strip()
        if not q:
            self.filtered_items = self.items
        else:
            self.filtered_items = [
                it for it in self.items
                if q in it.get('label', '').lower()
                or q in it.get('value', '').lower()
                or q in it.get('domain', '').lower()
                or q in it.get('category', '').lower()
                or q in it.get('fieldId', '').lower()
            ]

        # Clear existing list items
        for widget in self.list_frame.winfo_children():
            widget.destroy()

        if not self.filtered_items:
            empty_lbl = tk.Label(
                self.list_frame,
                text="هیچ مقداری یافت نشد.\nبا اکستنشن یا در صفحه ابزارها مقدار اضافه کنید.",
                font=("Segoe UI", 9), fg="#64748b", bg="#0f172a", justify="center"
            )
            empty_lbl.pack(pady=40)
            return

        # Render top 8 items
        for idx, it in enumerate(self.filtered_items[:8]):
            is_sel = (idx == self.selected_index)
            bg_col = "#312e81" if is_sel else "#1e293b"
            bd_col = "#6366f1" if is_sel else "#334155"

            card = tk.Frame(
                self.list_frame, bg=bg_col,
                padx=8, pady=6, cursor="hand2",
                highlightthickness=1, highlightbackground=bd_col
            )
            card.pack(fill="x", pady=2)

            # Row 1: Label + Tag
            r1 = tk.Frame(card, bg=bg_col)
            r1.pack(fill="x")

            lbl = tk.Label(
                r1, text=it.get('label', 'آیتم'),
                font=("Segoe UI", 9, "bold"), fg="#ffffff", bg=bg_col
            )
            lbl.pack(side="left")

            domain = it.get('domain')
            if domain:
                dom_lbl = tk.Label(
                    r1, text=domain,
                    font=("Segoe UI", 7, "bold"), fg="#a5b4fc", bg=bg_col
                )
                dom_lbl.pack(side="right")

            # Row 2: Value
            val_txt = it.get('value', '')
            if len(val_txt) > 42:
                val_txt = val_txt[:42] + '...'

            val_lbl = tk.Label(
                card, text=val_txt,
                font=("Consolas", 8), fg="#cbd5e1" if is_sel else "#94a3b8", bg=bg_col, anchor="w"
            )
            val_lbl.pack(fill="x", pady=(2, 0))

            # Bind click
            def make_handler(target_idx):
                return lambda e: self.select_and_choose(target_idx)

            for w in [card, r1, lbl, val_lbl]:
                w.bind("<Button-1>", make_handler(idx))

    def move_selection(self, delta):
        if not self.filtered_items:
            return
        self.selected_index = (self.selected_index + delta) % min(len(self.filtered_items), 8)
        self.filter_and_render()

    def select_and_choose(self, idx):
        self.selected_index = idx
        self.choose_selected()

    def choose_selected(self):
        if not self.filtered_items or self.selected_index >= len(self.filtered_items):
            return
        item = self.filtered_items[self.selected_index]
        val = item.get('value', '')

        saved_hwnd = self.prev_hwnd
        self.hide()

        # Place to clipboard and send Ctrl+V
        set_clipboard(val)
        time.sleep(0.04)
        paste_clipboard(saved_hwnd)

palette = AutofillPalette()

def hotkey_listener_thread():
    user32.RegisterHotKey(None, HOTKEY_ID_ALTV, MOD_ALT, VK_V)
    user32.RegisterHotKey(None, HOTKEY_ID_CTRLALTV, MOD_CONTROL | MOD_ALT, VK_V)
    user32.RegisterHotKey(None, HOTKEY_ID_ALTBACKTICK, MOD_ALT, VK_OEM_3)

    msg = wintypes.MSG()
    while user32.GetMessageW(ctypes.byref(msg), None, 0, 0) != 0:
        if msg.message == 0x0312:  # WM_HOTKEY
            prev_hwnd = user32.GetForegroundWindow()
            if palette.root:
                palette.root.after(0, lambda h=prev_hwnd: palette.toggle(h))
        user32.TranslateMessage(ctypes.byref(msg))
        user32.DispatchMessageW(ctypes.byref(msg))

def main():
    palette.build_gui()

    t = threading.Thread(target=hotkey_listener_thread, daemon=True)
    t.start()

    palette.root.mainloop()

if __name__ == '__main__':
    main()
