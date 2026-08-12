# Official RIMA image layer

Файлы в этой папке создаются скриптом `scripts/import_official_assets.py` перед browser QA и GitHub Pages deploy.

Источник: публичный официальный сайт https://xn--h1aehhjhg.agency/ и его `static.tildacdn.com` assets.

URL каждого файла и SHA-256 закреплены в importer-скрипте. Это не копия Tilda-разметки: изображения используются только как контентный слой поверх собственных пяти дизайн-систем RIMA preview.

Локально перед preview:

```bash
python3 scripts/import_official_assets.py
python3 -m http.server 8080
```
