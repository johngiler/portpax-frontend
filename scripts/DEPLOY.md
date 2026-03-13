# Deploy PortPax frontend (itm.portpax.com)

Servidor compartido con wms.rbcold.com. Estructura paralela: `/home/git/rbcold/frontend` (rbcold) y `/home/git/itm/frontend` (PortPax).

## Requisitos

- SSH en `~/.ssh/config`: Host `portpax-frontend` → itm.portpax.com, User root, IdentityFile correcto.
- Primera vez: aceptar host key con `ssh portpax-frontend true`.

## Deploy habitual (después de tener el servidor configurado)

Desde el directorio **frontend** del repo:

```bash
./scripts/deploy.sh
```

O desde la raíz del repo:

```bash
frontend/scripts/deploy.sh
```

El script hace `npm run build` (genera `out/`), luego **rsync** de `out/` a `portpax-frontend:/home/git/itm/frontend/dist/`.

---

## Setup una sola vez en el servidor (itm.portpax.com)

Conectar como root: `ssh portpax-frontend`.

### 1. Directorio para el frontend

```bash
mkdir -p /home/git/itm/frontend/dist
chown -R git:git /home/git/itm
```

### 2. Nginx: solo HTTP al principio (para Let's Encrypt)

Crear `/etc/nginx/sites-available/itm.portpax.com.conf` con **solo** el bloque HTTP (puerto 80). No redirigir a HTTPS todavía para que certbot pueda validar:

```nginx
server {
    listen 80;
    server_name itm.portpax.com;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type "text/plain";
        try_files $uri =404;
    }

    location / {
        return 404;
    }
}
```

Habilitar y comprobar:

```bash
ln -sf /etc/nginx/sites-available/itm.portpax.com.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 3. Let's Encrypt

```bash
certbot --nginx -d itm.portpax.com
```

Certbot pedirá email y ajustará la config (añadirá HTTPS). Después, editar el vhost y dejar el bloque HTTPS con **root** y **try_files** de PortPax:

- `root /home/git/itm/frontend/dist;`
- `location / { try_files $uri $uri/ /index.html; }`

O copiar el archivo completo `scripts/nginx-itm.portpax.com.conf` al servidor (ya trae esos valores) y volver a cargar nginx:

```bash
# En el servidor, después de certbot, reemplazar con la config completa del repo
nginx -t && systemctl reload nginx
```

### 4. Comprobar

- Hacer al menos un deploy: desde tu máquina `./scripts/deploy.sh`.
- Abrir https://itm.portpax.com y verificar que carga el frontend.

---

## Estructura en el servidor (referencia)

| Sitio            | Nginx root                      | Deploy (rsync)              |
|------------------|----------------------------------|-----------------------------|
| wms.rbcold.com   | /home/git/frontend/dist         | (rbcold)                    |
| itm.portpax.com  | /home/git/itm/frontend/dist     | `scripts/deploy.sh` → aquí  |

El script usa **rsync** con `--delete` para que el contenido en el servidor coincida con el build local.
