import os

def convert_to_lf(filepath):
    with open(filepath, 'rb') as f:
        content = f.read()
    
    # Replace CRLF with LF
    content = content.replace(b'\r\n', b'\n')
    
    with open(filepath, 'wb') as f:
        f.write(content)
    print(f"Converted {filepath} to LF line endings.")

if __name__ == "__main__":
    filepath = r'd:\TAREAS UNAH 2026\SISTEMAS EXPERTOS\ProyectoHotel\SistemaHotel\hotel-management-system\backend\entrypoint.sh'
    if os.path.exists(filepath):
        convert_to_lf(filepath)
    else:
        print(f"File {filepath} not found.")
