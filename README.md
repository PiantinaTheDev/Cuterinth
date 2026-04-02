# Cuterinth
Add addons to modrinth, make it cute, make it nice.

# Cuterinth Themes
A default theme is a json file fabricated like:
```json
{
  "name": "Theme Name",
  "author": "Your Name",
  "vars": { "--style":"#fff" }
}```

Every time you open it will auto launch modrinth and inject cuterinth code,
download a theme and make it cute!

# Injector Usage
```node injector.js script.js```
This will open modrinth if not already running and execute the script.js code inside the console.
