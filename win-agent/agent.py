import http.server
import json
import string
import ctypes
import os
import sys
import platform
import socket
import subprocess
from concurrent.futures import ThreadPoolExecutor
import csv
import io
import re
import time
import shutil
import urllib.parse

DEFAULT_PORT = 23157
MAX_PORT_ATTEMPTS = 50

# Cache for services and tasks to make API calls fast
_services_cache = {'data': None, 'time': 0}
_tasks_cache = {'data': None, 'time': 0}
_firewall_cache = {'data': None, 'time': 0}
_listening_ports_cache = {'data': None, 'time': 0}
CACHE_TTL = 30  # seconds

def run_cmd(args, timeout=10, text=True, errors='ignore', capture_output=True, encoding=None):
    """
    Executes a system command completely silently in the background.
    Guarantees no cmd.exe or conhost.exe window appears or blinks on screen.
    """
    kwargs = {
        'capture_output': capture_output,
        'text': text,
        'errors': errors,
        'timeout': timeout
    }
    if encoding:
        kwargs['encoding'] = encoding
    if sys.platform == 'win32':
        kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = subprocess.SW_HIDE
        kwargs['startupinfo'] = startupinfo
    return subprocess.run(args, **kwargs)

def get_drives_info():
    drives = []
    try:
        buf = ctypes.create_unicode_buffer(1024)
        ctypes.windll.kernel32.GetLogicalDriveStringsW(1024, buf)
        raw_drives = [s for s in ''.join(buf).split('\x00') if s]
    except Exception:
        raw_drives = ['C:\\', 'D:\\', 'F:\\']

    for path in raw_drives:
        try:
            dtype = ctypes.windll.kernel32.GetDriveTypeW(path)
            # Only query Fixed Disks (3) to avoid blocking on empty CD-ROMs or offline network shares
            if dtype == 3:
                usage = shutil.disk_usage(path)
                vol = ctypes.create_unicode_buffer(1024)
                fs = ctypes.create_unicode_buffer(1024)
                ctypes.windll.kernel32.GetVolumeInformationW(path, vol, 1024, None, None, None, fs, 1024)
                tot = usage.total
                usd = usage.used
                fre = usage.free
                pct = round((usd / tot) * 100, 1) if tot > 0 else 0
                drives.append({
                    'drive': path.rstrip('\\'),
                    'path': path,
                    'label': vol.value or 'Local Disk',
                    'fs': fs.value or 'NTFS',
                    'type': 'درایو دیسک سخت',
                    'type_id': 3,
                    'total_gb': round(tot / (1024**3), 2),
                    'free_gb': round(fre / (1024**3), 2),
                    'used_gb': round(usd / (1024**3), 2),
                    'percent': pct,
                    'is_low_space': pct >= 90.0
                })
        except Exception:
            pass
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

def get_services_list(force_refresh=False):
    global _services_cache
    now = time.time()
    if not force_refresh and _services_cache['data'] and (now - _services_cache['time'] < CACHE_TTL):
        return _services_cache['data']

    cmd = 'Get-Service | Select-Object Name, DisplayName, Status, StartType | ConvertTo-Json -Compress'
    try:
        res = run_cmd(
            ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', cmd],
            timeout=10, encoding='utf-8'
        )
        data = json.loads(res.stdout) if res.stdout.strip() else []
    except Exception:
        return _services_cache['data'] or []

    status_map = {
        1: 'Stopped',
        2: 'StartPending',
        3: 'StopPending',
        4: 'Running',
        5: 'ContinuePending',
        6: 'PausePending',
        7: 'Paused'
    }
    type_map = {
        0: 'Boot',
        1: 'System',
        2: 'Automatic',
        3: 'Manual',
        4: 'Disabled'
    }

    services = []
    for s in data:
        services.append({
            'name': s.get('Name'),
            'display_name': s.get('DisplayName') or s.get('Name'),
            'status': status_map.get(s.get('Status'), 'Unknown'),
            'start_type': type_map.get(s.get('StartType'), 'Unknown')
        })

    services.sort(key=lambda x: (0 if x['status'] == 'Running' else 1, x['name'].lower()))
    _services_cache = {'data': services, 'time': now}
    return services

def get_service_status_fast(name):
    try:
        res = run_cmd(['sc.exe', 'query', name], timeout=3)
        if res.returncode != 0:
            return {'name': name, 'status': 'Stopped', 'exists': False}
        state_match = re.search(r'STATE\s*:\s*\d+\s+([A-Z_]+)', res.stdout)
        status_str = state_match.group(1) if state_match else 'UNKNOWN'
        formatted = status_str.replace('_', ' ').title().replace(' ', '')
        return {'name': name, 'status': formatted, 'exists': True}
    except Exception:
        return {'name': name, 'status': 'Unknown', 'exists': False}

def get_services_status_batch(names):
    if not names:
        return []
    with ThreadPoolExecutor(max_workers=min(len(names), 10)) as executor:
        return list(executor.map(get_service_status_fast, names))

def control_service(name, action):
    global _services_cache
    _services_cache['time'] = 0  # invalidate cache
    try:
        if action == 'start':
            res = run_cmd(
                ['powershell', '-NoProfile', '-Command', f"Start-Service -Name '{name}'"],
                timeout=8
            )
        elif action == 'stop':
            res = run_cmd(
                ['powershell', '-NoProfile', '-Command', f"Stop-Service -Name '{name}' -Force"],
                timeout=8
            )
        elif action == 'restart':
            res = run_cmd(
                ['powershell', '-NoProfile', '-Command', f"Restart-Service -Name '{name}' -Force"],
                timeout=10
            )
        else:
            return {'ok': False, 'error': f"عملیات '{action}' معتبر نیست."}

        current = get_service_status_fast(name)
        return {
            'ok': res.returncode == 0,
            'action': action,
            'service': name,
            'current_status': current.get('status'),
            'output': res.stdout.strip() or res.stderr.strip()
        }
    except Exception as e:
        return {'ok': False, 'error': str(e)}

def get_tasks_list(force_refresh=False):
    global _tasks_cache
    now = time.time()
    if not force_refresh and _tasks_cache['data'] and (now - _tasks_cache['time'] < CACHE_TTL):
        return _tasks_cache['data']

    try:
        res = run_cmd(['schtasks', '/query', '/fo', 'csv'], timeout=8)
        if res.returncode != 0:
            return _tasks_cache['data'] or []

        reader = csv.DictReader(io.StringIO(res.stdout))
        tasks = []
        for row in reader:
            raw_name = row.get('TaskName', '').strip()
            if not raw_name:
                continue

            clean_name = raw_name.lstrip('\\')
            folder = '\\' + '\\'.join(clean_name.split('\\')[:-1]) if '\\' in clean_name else '\\'
            short_name = clean_name.split('\\')[-1]

            tasks.append({
                'name': short_name,
                'path': folder,
                'full_path': raw_name,
                'status': row.get('Status', 'Unknown'),
                'next_run': row.get('Next Run Time', 'N/A')
            })

        tasks.sort(key=lambda x: (0 if 'mohrez' in x['name'].lower() else 1, x['name'].lower()))
        _tasks_cache = {'data': tasks, 'time': now}
        return tasks
    except Exception:
        return _tasks_cache['data'] or []

def get_task_detail(task_name):
    try:
        res = run_cmd(['schtasks', '/query', '/tn', task_name, '/fo', 'csv', '/v'], timeout=4)
        if res.returncode != 0:
            # Try with leading backslash
            if not task_name.startswith('\\'):
                res = run_cmd(['schtasks', '/query', '/tn', f"\\{task_name}", '/fo', 'csv', '/v'], timeout=4)

        if res.returncode != 0:
            return {'name': task_name, 'status': 'NotFound', 'exists': False}

        reader = csv.DictReader(io.StringIO(res.stdout))
        row = next(reader, None)
        if not row:
            return {'name': task_name, 'status': 'NotFound', 'exists': False}

        return {
            'name': task_name.lstrip('\\'),
            'raw_name': task_name,
            'status': row.get('Status', 'Unknown'),
            'state': row.get('Scheduled Task State', 'Enabled'),
            'last_run': row.get('Last Run Time', 'N/A'),
            'next_run': row.get('Next Run Time', 'N/A'),
            'last_result': row.get('Last Result', '0'),
            'author': row.get('Author', 'N/A'),
            'task_to_run': row.get('Task To Run', 'N/A'),
            'exists': True
        }
    except Exception:
        return {'name': task_name, 'status': 'Unknown', 'exists': False}

def get_tasks_details_batch(names):
    if not names:
        return []
    with ThreadPoolExecutor(max_workers=min(len(names), 10)) as executor:
        return list(executor.map(get_task_detail, names))

def control_task(task_name, action):
    global _tasks_cache
    _tasks_cache['time'] = 0  # invalidate cache
    try:
        if action == 'run':
            res = run_cmd(['schtasks', '/run', '/tn', task_name], timeout=5)
        elif action == 'end':
            res = run_cmd(['schtasks', '/end', '/tn', task_name], timeout=5)
        elif action == 'enable':
            res = run_cmd(['schtasks', '/change', '/tn', task_name, '/enable'], timeout=5)
        elif action == 'disable':
            res = run_cmd(['schtasks', '/change', '/tn', task_name, '/disable'], timeout=5)
        else:
            return {'ok': False, 'error': f"عملیات '{action}' روی تسک نامعتبر است."}

        current = get_task_detail(task_name)
        return {
            'ok': res.returncode == 0,
            'action': action,
            'task': task_name,
            'detail': current,
            'output': res.stdout.strip() or res.stderr.strip()
        }
    except Exception as e:
        return {'ok': False, 'error': str(e)}

# ==================== LISTENING PORTS & SERVICES ====================

def get_listening_ports(force_refresh=False):
    global _listening_ports_cache
    now = time.time()
    if not force_refresh and _listening_ports_cache['data'] and (now - _listening_ports_cache['time'] < 10):
        return _listening_ports_cache['data']

    # 1. Map PID to Process Name and Service Name
    proc_res = run_cmd(['tasklist', '/svc', '/fo', 'csv'], timeout=6)
    proc_map = {}
    svc_map = {}
    if proc_res.returncode == 0:
        for row in csv.reader(io.StringIO(proc_res.stdout)):
            if len(row) >= 3:
                try:
                    pid = int(row[1])
                    pname = row[0]
                    services = row[2]
                    proc_map[pid] = pname
                    if services and services != 'N/A':
                        svc_map[pid] = services
                except Exception:
                    pass

    # 2. Get active TCP listening sockets
    net_res = run_cmd(['netstat', '-ano', '-p', 'tcp'], timeout=6)
    ports = []
    seen = set()

    common_port_names = {
        80: 'HTTP Web Server',
        443: 'HTTPS Web Server',
        135: 'RPC Endpoint Mapper',
        445: 'SMB File Sharing',
        3389: 'Remote Desktop (RDP)',
        23157: 'Mohrez Windows Agent',
        53: 'DNS Service',
        21: 'FTP Server',
        22: 'SSH Server',
        3306: 'MySQL Database',
        5432: 'PostgreSQL Database',
        1433: 'MS SQL Server',
        6379: 'Redis Cache',
        27017: 'MongoDB Database',
        8080: 'HTTP Alternate Proxy',
        8443: 'HTTPS Alternate',
        9000: 'PHP-FPM / SonarQube',
        1080: 'SOCKS5 Proxy',
        10808: 'V2Ray / Xray Proxy',
        10809: 'V2Ray HTTP Proxy',
        5353: 'mDNS Multicast',
        5040: 'Connected Devices Platform'
    }

    if net_res.returncode == 0:
        for line in net_res.stdout.splitlines():
            if 'LISTENING' in line:
                parts = line.split()
                if len(parts) >= 5:
                    local_addr = parts[1]
                    try:
                        pid = int(parts[4])
                        port_str = local_addr.rsplit(':', 1)[-1]
                        port_num = int(port_str)
                        ip_addr = local_addr.rsplit(':', 1)[0].strip('[]')

                        key = (port_num, pid)
                        if key in seen:
                            continue
                        seen.add(key)

                        proc_name = proc_map.get(pid, 'System' if pid == 4 else f'PID:{pid}')
                        svc_name = svc_map.get(pid, common_port_names.get(port_num, ''))

                        ports.append({
                            'port': port_num,
                            'address': local_addr,
                            'ip': ip_addr,
                            'pid': pid,
                            'process': proc_name,
                            'service': svc_name,
                            'common_desc': common_port_names.get(port_num, '')
                        })
                    except Exception:
                        pass

    # Sort ports: Agent first, then by port number
    ports.sort(key=lambda x: (0 if x['port'] == DEFAULT_PORT else 1, x['port']))
    _listening_ports_cache = {'data': ports, 'time': now}
    return ports

# ==================== WINDOWS FIREWALL RULES ====================

def get_firewall_rules(force_refresh=False):
    global _firewall_cache
    now = time.time()
    if not force_refresh and _firewall_cache['data'] and (now - _firewall_cache['time'] < 25):
        return _firewall_cache['data']

    res = run_cmd(['netsh', 'advfirewall', 'firewall', 'show', 'rule', 'name=all'], timeout=12)
    rules = []
    if res.returncode == 0:
        text = res.stdout
        blocks = re.split(r'\n(?=Rule Name:\s+)', text)
        for b in blocks:
            if not b.strip():
                continue
            name_m = re.search(r'Rule Name:\s+(.+)', b)
            if not name_m:
                continue
            name = name_m.group(1).strip()
            enabled_m = re.search(r'Enabled:\s+(.+)', b)
            direction_m = re.search(r'Direction:\s+(.+)', b)
            action_m = re.search(r'Action:\s+(.+)', b)
            proto_m = re.search(r'Protocol:\s+(.+)', b)
            port_m = re.search(r'LocalPort:\s+(.+)', b)
            prog_m = re.search(r'Program:\s+(.+)', b)
            profile_m = re.search(r'Profiles:\s+(.+)', b)

            enabled = enabled_m.group(1).strip() if enabled_m else 'No'
            action = action_m.group(1).strip() if action_m else 'Allow'
            direction = direction_m.group(1).strip() if direction_m else 'In'
            protocol = proto_m.group(1).strip() if proto_m else 'Any'
            local_port = port_m.group(1).strip() if port_m else 'Any'
            program = prog_m.group(1).strip() if prog_m else 'Any'
            profiles = profile_m.group(1).strip() if profile_m else 'All'

            rules.append({
                'name': name,
                'enabled': enabled == 'Yes',
                'direction': direction,
                'action': action,
                'protocol': protocol,
                'port': local_port,
                'program': program,
                'profiles': profiles,
                'is_open_port': (enabled == 'Yes' and action == 'Allow' and direction == 'In' and local_port != 'Any')
            })

    # Sort: open inbound ports first, then alphabetically
    rules.sort(key=lambda x: (0 if x['is_open_port'] else (1 if x['enabled'] else 2), x['name'].lower()))
    _firewall_cache = {'data': rules, 'time': now}
    return rules

def get_firewall_rule_detail(rule_name):
    try:
        res = run_cmd(['netsh', 'advfirewall', 'firewall', 'show', 'rule', f'name={rule_name}'], timeout=4)
        if res.returncode != 0:
            return {'name': rule_name, 'exists': False}
        b = res.stdout
        enabled_m = re.search(r'Enabled:\s+(.+)', b)
        direction_m = re.search(r'Direction:\s+(.+)', b)
        action_m = re.search(r'Action:\s+(.+)', b)
        proto_m = re.search(r'Protocol:\s+(.+)', b)
        port_m = re.search(r'LocalPort:\s+(.+)', b)
        prog_m = re.search(r'Program:\s+(.+)', b)
        profile_m = re.search(r'Profiles:\s+(.+)', b)

        enabled = enabled_m.group(1).strip() if enabled_m else 'No'
        action = action_m.group(1).strip() if action_m else 'Allow'
        direction = direction_m.group(1).strip() if direction_m else 'In'
        protocol = proto_m.group(1).strip() if proto_m else 'Any'
        local_port = port_m.group(1).strip() if port_m else 'Any'
        program = prog_m.group(1).strip() if prog_m else 'Any'
        profiles = profile_m.group(1).strip() if profile_m else 'All'

        return {
            'name': rule_name,
            'enabled': enabled == 'Yes',
            'direction': direction,
            'action': action,
            'protocol': protocol,
            'port': local_port,
            'program': program,
            'profiles': profiles,
            'is_open_port': (enabled == 'Yes' and action == 'Allow' and direction == 'In' and local_port != 'Any'),
            'exists': True
        }
    except Exception:
        return {'name': rule_name, 'exists': False}

def get_firewall_rules_batch(names):
    if not names:
        return []
    with ThreadPoolExecutor(max_workers=min(len(names), 10)) as executor:
        return list(executor.map(get_firewall_rule_detail, names))

def toggle_firewall_rule(rule_name, enable=True):
    global _firewall_cache
    _firewall_cache['time'] = 0  # Invalidate
    status_str = 'yes' if enable else 'no'
    try:
        res = run_cmd(['netsh', 'advfirewall', 'firewall', 'set', 'rule', f'name={rule_name}', 'new', f'enable={status_str}'], timeout=6)
        detail = get_firewall_rule_detail(rule_name)
        return {
            'ok': res.returncode == 0,
            'rule': rule_name,
            'enabled': detail.get('enabled', enable),
            'detail': detail,
            'output': res.stdout.strip() or res.stderr.strip()
        }
    except Exception as e:
        return {'ok': False, 'error': str(e)}

# ==================== HTTP SERVER HANDLER ====================

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

    def _read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                raw_data = self.rfile.read(content_length).decode('utf-8')
                return json.loads(raw_data)
        except Exception:
            pass
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        if path == '':
            path = '/'
        query = urllib.parse.parse_qs(parsed.query)

        if path in ['/', '/health', '/api/health']:
            self._send_json(200, {
                'ok': True,
                'service': 'Mohrez Windows Tools Backend Agent',
                'status': 'running',
                'port': self.server.server_port,
                'system': get_system_summary()
            })

        elif path in ['/api/drives', '/drives']:
            drives = get_drives_info()
            self._send_json(200, {
                'ok': True,
                'count': len(drives),
                'drives': drives,
                'system': get_system_summary()
            })

        elif path in ['/api/system', '/system']:
            self._send_json(200, {
                'ok': True,
                'system': get_system_summary(),
                'drives': get_drives_info()
            })

        elif path in ['/api/services', '/services']:
            force = 'refresh' in query
            services = get_services_list(force_refresh=force)
            self._send_json(200, {
                'ok': True,
                'count': len(services),
                'services': services
            })

        elif path in ['/api/services/status']:
            names_param = query.get('names', [''])[0]
            names = [n.strip() for n in names_param.split(',') if n.strip()]
            details = get_services_status_batch(names)
            self._send_json(200, {'ok': True, 'services': details})

        elif path in ['/api/tasks', '/tasks']:
            force = 'refresh' in query
            tasks = get_tasks_list(force_refresh=force)
            self._send_json(200, {
                'ok': True,
                'count': len(tasks),
                'tasks': tasks
            })

        elif path in ['/api/tasks/detail']:
            name = query.get('name', [''])[0]
            detail = get_task_detail(name)
            self._send_json(200, {'ok': True, 'task': detail})

        elif path in ['/api/ports', '/ports']:
            force = 'refresh' in query
            ports = get_listening_ports(force_refresh=force)
            self._send_json(200, {
                'ok': True,
                'count': len(ports),
                'ports': ports
            })

        elif path in ['/api/firewall', '/firewall', '/api/firewall/rules']:
            force = 'refresh' in query
            rules = get_firewall_rules(force_refresh=force)
            self._send_json(200, {
                'ok': True,
                'count': len(rules),
                'rules': rules
            })

        elif path in ['/api/firewall/detail']:
            name = query.get('name', [''])[0]
            detail = get_firewall_rule_detail(name)
            self._send_json(200, {'ok': True, 'rule': detail})

        else:
            self._send_json(404, {
                'ok': False,
                'error': f"Endpoint '{self.path}' not found"
            })

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        data = self._read_json_body()

        if path in ['/api/services/action']:
            service_name = data.get('service')
            action = data.get('action')
            if not service_name or not action:
                self._send_json(400, {'ok': False, 'error': 'نام سرویس و نوع عملیات الزامی است.'})
                return
            result = control_service(service_name, action)
            self._send_json(200, result)

        elif path in ['/api/services/details']:
            names = data.get('names', [])
            details = get_services_status_batch(names)
            self._send_json(200, {'ok': True, 'services': details})

        elif path in ['/api/tasks/action']:
            task_name = data.get('task')
            action = data.get('action')
            if not task_name or not action:
                self._send_json(400, {'ok': False, 'error': 'نام تسک و نوع عملیات الزامی است.'})
                return
            result = control_task(task_name, action)
            self._send_json(200, result)

        elif path in ['/api/tasks/details']:
            names = data.get('names', [])
            details = get_tasks_details_batch(names)
            self._send_json(200, {'ok': True, 'tasks': details})

        elif path in ['/api/firewall/action']:
            rule_name = data.get('rule')
            action = data.get('action')  # 'enable' or 'disable'
            if not rule_name or action not in ['enable', 'disable']:
                self._send_json(400, {'ok': False, 'error': 'نام رول فایروال و اکشن معتبر (enable یا disable) الزامی است.'})
                return
            result = toggle_firewall_rule(rule_name, enable=(action == 'enable'))
            self._send_json(200, result)

        elif path in ['/api/firewall/details']:
            names = data.get('names', [])
            details = get_firewall_rules_batch(names)
            self._send_json(200, {'ok': True, 'rules': details})

        else:
            self._send_json(404, {
                'ok': False,
                'error': f"POST Endpoint '{self.path}' not found"
            })

    def log_message(self, format, *args):
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
    except Exception:
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
            print(f"Mohrez Windows Tools Backend Agent Running on port {chosen_port}")
            sys.stdout.flush()
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()

if __name__ == '__main__':
    main()
