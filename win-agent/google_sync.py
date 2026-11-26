"""
Mohrez Browser Assistant - Google OAuth 2.0 & Google Drive AppData Sync Module
Zero-dependency implementation using Python standard library (urllib.request).
Features:
- Dual-connection resilience: Direct connection with automatic fallback to local HTTP proxy (10809).
- Secure token storage with auto-refresh via refresh_token.
- Google Drive AppData folder sync (isolated, dedicated hidden space for this app).
"""

import os
import json
import time
import urllib.request
import urllib.parse
import ssl

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRET_FILE = os.path.join(CUR_DIR, 'google_client_secret.json')
TOKENS_FILE = os.path.join(CUR_DIR, 'google_tokens.json')
SYNC_META_FILE = os.path.join(CUR_DIR, 'google_sync_meta.json')

SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file'
]

def load_client_config():
    if not os.path.exists(CLIENT_SECRET_FILE):
        return None
    try:
        with open(CLIENT_SECRET_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            web = data.get('web') or data.get('installed') or {}
            client_id = web.get('client_id')
            client_secret = web.get('client_secret')
            redirect_uris = web.get('redirect_uris', [])
            redirect_uri = redirect_uris[0] if redirect_uris else 'http://127.0.0.1:23157/api/auth/google/callback'
            return {
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'auth_uri': web.get('auth_uri', 'https://accounts.google.com/o/oauth2/auth'),
                'token_uri': web.get('token_uri', 'https://oauth2.googleapis.com/token')
            }
    except Exception:
        return None

def make_http_request(url, data=None, headers=None, method=None, timeout=12):
    """
    Dual-connection executor: Tries direct connection first,
    falls back seamlessly to local HTTP proxy on 127.0.0.1:10809 if needed.
    Correctly extracts Google API error JSON bodies on HTTPError (400, 403, etc.)
    """
    req_headers = {
        'User-Agent': 'Mohrez-Browser-Assistant/2.0'
    }
    if headers:
        req_headers.update(headers)

    # 1. Try direct connection
    try:
        req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode('utf-8')
    except urllib.error.HTTPError as e_http:
        try:
            err_body = e_http.read().decode('utf-8')
            err_json = json.loads(err_body)
            msg = err_json.get('error', {}).get('message') or err_body
        except Exception:
            msg = str(e_http)
        raise Exception(f"Google API Error ({e_http.code}): {msg}")
    except Exception as e_direct:
        # 2. Fallback to local HTTP proxy
        try:
            proxy_handler = urllib.request.ProxyHandler({
                'http': 'http://127.0.0.1:10809',
                'https': 'http://127.0.0.1:10809'
            })
            opener = urllib.request.build_opener(proxy_handler)
            req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
            with opener.open(req, timeout=timeout) as resp:
                return resp.status, resp.read().decode('utf-8')
        except urllib.error.HTTPError as e_http2:
            try:
                err_body = e_http2.read().decode('utf-8')
                err_json = json.loads(err_body)
                msg = err_json.get('error', {}).get('message') or err_body
            except Exception:
                msg = str(e_http2)
            raise Exception(f"Google API Error ({e_http2.code}): {msg}")
        except Exception as e_proxy:
            raise Exception(f"خطای شبکه: اتصال مستقیم ناموفق بود ({e_direct})")

def get_auth_url(state='mohrez_sync'):
    cfg = load_client_config()
    if not cfg or not cfg.get('client_id'):
        return None, "فایل تنظیمات Google Client Secret یافت نشد."

    params = {
        'client_id': cfg['client_id'],
        'redirect_uri': cfg['redirect_uri'],
        'response_type': 'code',
        'scope': ' '.join(SCOPES),
        'access_type': 'offline',
        'prompt': 'consent',
        'state': state
    }
    qs = urllib.parse.urlencode(params)
    return f"{cfg['auth_uri']}?{qs}", None

def exchange_code_for_tokens(code):
    cfg = load_client_config()
    if not cfg:
        return False, "Google client secret not configured."

    post_data = urllib.parse.urlencode({
        'code': code,
        'client_id': cfg['client_id'],
        'client_secret': cfg['client_secret'],
        'redirect_uri': cfg['redirect_uri'],
        'grant_type': 'authorization_code'
    }).encode('utf-8')

    headers = {'Content-Type': 'application/x-www-form-urlencoded'}

    try:
        status, body = make_http_request(cfg['token_uri'], data=post_data, headers=headers, method='POST')
        token_data = json.loads(body)
        if 'access_token' not in token_data:
            return False, token_data.get('error_description', 'Failed to retrieve access token')

        expires_in = token_data.get('expires_in', 3600)
        token_data['expires_at'] = time.time() + expires_in - 60  # 60s buffer

        # Fetch profile
        user_info = fetch_user_profile(token_data['access_token'])
        token_data['profile'] = user_info or {}

        # Save tokens
        save_tokens(token_data)
        return True, "ورود با گوگل با موفقیت انجام شد."
    except Exception as e:
        return False, str(e)

def fetch_user_profile(access_token):
    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        status, body = make_http_request('https://www.googleapis.com/oauth2/v2/userinfo', headers=headers, method='GET')
        return json.loads(body)
    except Exception:
        return None

def load_tokens():
    if not os.path.exists(TOKENS_FILE):
        return None
    try:
        with open(TOKENS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None

def save_tokens(tokens):
    try:
        with open(TOKENS_FILE, 'w', encoding='utf-8') as f:
            json.dump(tokens, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        return False

def get_valid_access_token():
    tokens = load_tokens()
    if not tokens or 'access_token' not in tokens:
        return None

    # Check if still valid
    expires_at = tokens.get('expires_at', 0)
    if time.time() < expires_at:
        return tokens['access_token']

    # Needs refresh
    refresh_token = tokens.get('refresh_token')
    if not refresh_token:
        return None

    cfg = load_client_config()
    if not cfg:
        return None

    post_data = urllib.parse.urlencode({
        'client_id': cfg['client_id'],
        'client_secret': cfg['client_secret'],
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    }).encode('utf-8')

    headers = {'Content-Type': 'application/x-www-form-urlencoded'}

    try:
        status, body = make_http_request(cfg['token_uri'], data=post_data, headers=headers, method='POST')
        new_data = json.loads(body)
        if 'access_token' in new_data:
            tokens['access_token'] = new_data['access_token']
            tokens['expires_at'] = time.time() + new_data.get('expires_in', 3600) - 60
            if 'refresh_token' in new_data:
                tokens['refresh_token'] = new_data['refresh_token']
            save_tokens(tokens)
            return tokens['access_token']
    except Exception:
        pass

    return None

def get_sync_status():
    tokens = load_tokens()
    meta = {}
    if os.path.exists(SYNC_META_FILE):
        try:
            with open(SYNC_META_FILE, 'r', encoding='utf-8') as f:
                meta = json.load(f)
        except Exception:
            pass

    if not tokens or 'access_token' not in tokens:
        return {
            'connected': False,
            'email': None,
            'name': None,
            'picture': None,
            'last_sync': meta.get('last_sync'),
            'last_sync_size': meta.get('last_sync_size')
        }

    profile = tokens.get('profile', {})
    scope = tokens.get('scope', '') or ''
    has_drive = ('drive' in scope) or ('drive.appdata' in scope) or ('drive.file' in scope)
    return {
        'connected': True,
        'email': profile.get('email'),
        'name': profile.get('name'),
        'picture': profile.get('picture'),
        'has_drive_scope': has_drive,
        'scope': scope,
        'last_sync': meta.get('last_sync'),
        'last_sync_size': meta.get('last_sync_size'),
        'file_id': meta.get('file_id')
    }

def logout():
    try:
        if os.path.exists(TOKENS_FILE):
            os.remove(TOKENS_FILE)
        if os.path.exists(SYNC_META_FILE):
            os.remove(SYNC_META_FILE)
        return True
    except Exception:
        return False

# ==================== GOOGLE DRIVE APPDATA SYNC ====================

BACKUP_FILENAME = 'mohrez-homepage-backup.json'

def find_backup_file_id(access_token):
    """Searches for existing backup in Google Drive appDataFolder."""
    try:
        q = urllib.parse.quote(f"name = '{BACKUP_FILENAME}' and trashed = false")
        url = f"https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q={q}&fields=files(id,name,modifiedTime,size)"
        headers = {'Authorization': f'Bearer {access_token}'}
        status, body = make_http_request(url, headers=headers, method='GET')
        res = json.loads(body)
        files = res.get('files', [])
        if files:
            return files[0]['id'], files[0]
    except Exception:
        pass
    return None, None

def upload_backup_to_drive(backup_package):
    """Uploads or updates the JSON backup file in Google Drive AppData folder."""
    tokens = load_tokens()
    if not tokens or 'access_token' not in tokens:
        return {'ok': False, 'error': 'حساب گوگل متصل نیست یا توکن منقضی شده است.'}

    scope = tokens.get('scope', '') or ''
    if 'drive' not in scope:
        return {
            'ok': False,
            'insufficient_scope': True,
            'error': 'مجوز Google Drive به این نشست داده نشده است! لطفاً روی «قطع اتصال» کلیک کرده و مجدداً دکمه «ورود با حساب گوگل» را بزنید و در صفحه مجوزهای گوگل، حتماً تیک گزینه اجازه دسترسی به Google Drive را علامت بزنید.'
        }

    access_token = get_valid_access_token()
    if not access_token:
        return {'ok': False, 'error': 'توکن دسترسی معتبر نیست. لطفاً مجدداً وارد حساب شوید.'}

    json_str = json.dumps(backup_package, ensure_ascii=False, indent=2)
    payload_bytes = json_str.encode('utf-8')
    existing_id, existing_meta = find_backup_file_id(access_token)

    try:
        if existing_id:
            # Update existing file content
            url = f"https://www.googleapis.com/upload/drive/v3/files/{existing_id}?uploadType=media"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json; charset=utf-8'
            }
            status, body = make_http_request(url, data=payload_bytes, headers=headers, method='PATCH')
            file_meta = json.loads(body)
            file_id = file_meta.get('id', existing_id)
        else:
            # Create new file in appDataFolder (Multipart)
            boundary = '-------MohrezBoundarySync' + str(int(time.time()))
            metadata = {
                'name': BACKUP_FILENAME,
                'parents': ['appDataFolder']
            }
            meta_part = json.dumps(metadata).encode('utf-8')

            body_parts = [
                f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'.encode('utf-8'),
                meta_part,
                f'\r\n--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'.encode('utf-8'),
                payload_bytes,
                f'\r\n--{boundary}--\r\n'.encode('utf-8')
            ]
            multipart_data = b''.join(body_parts)

            url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': f'multipart/related; boundary={boundary}'
            }
            status, body = make_http_request(url, data=multipart_data, headers=headers, method='POST')
            file_meta = json.loads(body)
            file_id = file_meta.get('id')

        # Record sync metadata
        synced_at = time.strftime('%Y-%m-%d %H:%M:%S')
        sync_meta = {
            'file_id': file_id,
            'last_sync': synced_at,
            'last_sync_size': len(payload_bytes)
        }
        with open(SYNC_META_FILE, 'w', encoding='utf-8') as f:
            json.dump(sync_meta, f, indent=2)

        return {
            'ok': True,
            'file_id': file_id,
            'synced_at': synced_at,
            'size': len(payload_bytes)
        }
    except Exception as e:
        return {'ok': False, 'error': f'خطا در آپلود به گوگل درایو: {str(e)}'}

def download_backup_from_drive():
    """Downloads the latest backup package from Google Drive AppData folder."""
    tokens = load_tokens()
    if not tokens or 'access_token' not in tokens:
        return {'ok': False, 'error': 'حساب گوگل متصل نیست.'}

    scope = tokens.get('scope', '') or ''
    if 'drive' not in scope:
        return {
            'ok': False,
            'insufficient_scope': True,
            'error': 'مجوز Google Drive در این نشست فعال نیست. لطفاً یک‌بار از حساب خارج شده و مجدداً با علامت زدن تیک Google Drive وارد شوید.'
        }

    access_token = get_valid_access_token()
    if not access_token:
        return {'ok': False, 'error': 'حساب گوگل متصل نیست.'}

    existing_id, existing_meta = find_backup_file_id(access_token)
    if not existing_id:
        return {'ok': False, 'error': 'هیچ فایل پشتیبانی در فضای ابری گوگل شما یافت نشد.'}

    try:
        url = f"https://www.googleapis.com/drive/v3/files/{existing_id}?alt=media"
        headers = {'Authorization': f'Bearer {access_token}'}
        status, body = make_http_request(url, headers=headers, method='GET')
        backup_data = json.loads(body)
        return {
            'ok': True,
            'backup': backup_data,
            'modified_time': existing_meta.get('modifiedTime') if existing_meta else None
        }
    except Exception as e:
        return {'ok': False, 'error': f'خطا در دانلود پشتیبان از گوگل درایو: {str(e)}'}
