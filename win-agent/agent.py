import http.server
import json
import string
import ctypes
import os
import sys
import platform
import socket

DEFAULT_PORT = 23157
MAX_PORT_ATTEMPTS = 50

def get_drives_info():
    drives = []
    bitmask = ctypes.windll.kernel32.GetLogicalDrives()
    type_names = {
        0: 'نامشخص',
        1: 'بدون مسیر ریشه',
        2: 'حافظه فلش / اکسترنال (USB)',
        3: 'درایو دیسک سخت (Fixed Disk)',
        4: 'درایو تحت شبکه (Network)',
        5: 'دیسک نوری (CD/DVD)',
        6: 'دیسک رم (RAM Disk)'
    }

    for letter in string.ascii_uppercase:
        if bitmask & 1:
            path = f"{letter}:\\"
            dtype = ctypes.windll.kernel32.GetDriveTypeW(path)
            try:
                free_b = ctypes.c_ulonglong(0)
                total_b = ctypes.c_ulonglong(0)
                total_free_b = ctypes.c_ulonglong(0)
                ret = ctypes.windll.kernel32.GetDiskFreeSpaceExW(
                    ctypes.c_wchar_p(path),
                    ctypes.byref(free_b),
                    ctypes.byref(total_b),
                    ctypes.byref(total_free_b)
                )

                vol_name = ctypes.create_unicode_buffer(1024)
                fs_name = ctypes.create_unicode_buffer(1024)
                ctypes.windll.kernel32.GetVolumeInformationW(
                    path, vol_name, 1024, None, None, None, fs_name, 1024
                )

                if ret and total_b.value > 0:
                    tot = total_b.value
                    fre = free_b.value
                    usd = tot - fre
                    percent = round((usd / tot) * 100, 1)
                    drives.append({
                        'drive': f"{letter}:",
                        'path': path,
                        'label': vol_name.value or 'Local Disk',
                        'fs': fs_name.value or 'NTFS',
                        'type': type_names.get(dtype, 'درایو دیسک سخت'),
                        'type_id': dtype,
                        'total_gb': round(tot / (1024**3), 2),
                        'free_gb': round(fre / (1024**3), 2),
                        'used_gb': round(usd / (1024**3), 2),
                        'percent': percent,
                        'is_low_space': percent >= 90.0
                    })
            except Exception:
                pass
        bitmask >>= 1
    return drives

def get_system_summary():
    return {
        'os': platform.system(),
        'os_version': platform.version(),
        'os_release': platform.release(),
        'machine': platform.machine(),
        'username': os.getenv('USERNAME', 'User'),
        'computer_name': os.getenv('COMPUTERNAME', 'Localhost')
    }

class WindowsAgentHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Connection', 'close')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def _send_json(self, status_code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()

    def do_GET(self):
        parsed_path = self.path.split('?')[0].rstrip('/')
        if parsed_path == '':
            parsed_path = '/'

        if parsed_path in ['/', '/health', '/api/health']:
            self._send_json(200, {
                'ok': True,
                'service': 'Windows Tools Backend Agent',
                'status': 'running',
                'port': self.server.server_port,
                'system': get_system_summary()
            })

        elif parsed_path in ['/api/drives', '/drives']:
            drives = get_drives_info()
            self._send_json(200, {
                'ok': True,
                'count': len(drives),
                'drives': drives,
                'system': get_system_summary()
            })

        elif parsed_path in ['/api/system', '/system']:
            self._send_json(200, {
                'ok': True,
                'system': get_system_summary(),
                'drives': get_drives_info()
            })

        else:
            self._send_json(404, {
                'ok': False,
                'error': f"Endpoint '{self.path}' not found",
                'available_endpoints': ['/api/health', '/api/drives', '/api/system']
            })

    def log_message(self, format, *args):
        # Safely log without failing when stdout is None or non-encodable
        try:
            if sys.stdout is not None:
                msg = f"[{self.log_date_time_string()}] {format % args}\n"
                sys.stdout.write(msg)
                sys.stdout.flush()
        except Exception:
            pass

class ReusableServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True

def find_available_port(start_port=DEFAULT_PORT, max_attempts=MAX_PORT_ATTEMPTS):
    port = start_port
    for _ in range(max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                port += 1
    return None

def write_port_file(port):
    try:
        cur_dir = os.path.dirname(os.path.abspath(__file__))
        port_file = os.path.join(cur_dir, 'server_port.txt')
        with open(port_file, 'w', encoding='utf-8') as f:
            f.write(str(port))
    except Exception as e:
        pass

def main():
    chosen_port = find_available_port(DEFAULT_PORT)
    if not chosen_port:
        sys.exit(1)

    write_port_file(chosen_port)
    server_address = ('127.0.0.1', chosen_port)
    httpd = ReusableServer(server_address, WindowsAgentHandler)

    try:
        if sys.stdout is not None:
            print(f"Windows Tools Backend Agent Running on port {chosen_port}")
            sys.stdout.flush()
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()

if __name__ == '__main__':
    main()
