# localizor

A packager that will compact all your translation keys onto one single file.

## Why ?

Managing translation keys always been complicated. You always need to remember to update the translation file when you remove translation usage. In general you end up with a translation file full of un-used keys. And in the most cases, they are complicated to find.

## How ?

localizor provides a simpler way to manage your keys. It uses the folder structure to organize keys in the main translation file. Simply create a `.locale.yml` next to the component which needs the translations, the process will take it and update the main translation file.

For example :

`src/components/header.js` :

```
...
<h1>{t('components.header.title')}</h1>
...
```

`src/components/header.locale.yml` :

`title: Main title`

Will be packaged on

`src/locales/translations.yml`

```
en:
  components:
    header:
     title: Main title
```

With this structure, if you want to know if the translation key is still in use, you just have to search after the related component in your components. If it is not, the key is unused.
Localizor provides you a file watcher which will automatically update the main translation file for you.

## Usage

```sh
yarn add localizor -D
yarn localizor
```

If you have an error on your folder while running localizor, a utility helps you find the wrong yml file that fails the script :

```sh
yarn localizor_check
```

## Config

You can configure localizor by adding an `.localizorrc` file on the root of your project.

Default config is :

```js
{
  root:          'src', // Root folder where it will look for translation files
  localeFile:    'locale', // The extension file for localizor will look (*.[localeFile].[extension], in this example *.locale.yml)
  extension:     'yml', // (yml || json)
  defaultLocale: 'en', // The root of the translation file
  targetFile:    'translations', // The path for the main file (/[targetFile].[extension], in this example ./translations.yml)
  watch:         true, // If the script shoud watch file change
  ignoreFiles:   /(^|[\/\\])\../, // Ignores files from being watched ( config here https://github.com/paulmillr/chokidar)
  watchFolder:   '.' // Folder where localizor should watch for translation files
}
```
