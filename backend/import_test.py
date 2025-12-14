import importlib, traceback
try:
    m = importlib.import_module('totem.views')
    print('loaded', hasattr(m, 'qr_reader'))
except Exception:
    print('IMPORT ERROR')
    traceback.print_exc()
