import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import globAll from 'glob-all'
import yaml from 'js-yaml'

// don't export these from index so the external types are cleaner
export const virtualModuleId = 'virtual:i18next-loader'
export const resolvedVirtualModuleId = '\0' + virtualModuleId

export function jsNormalizedLang(lang: string) {
  return lang.replace(/-/g, '_')
}

export function enumerateLangs(dir: string) {
  return fs.readdirSync(dir).filter(function (file) {
    return fs.statSync(path.join(dir, file)).isDirectory()
  })
}

//https://github.com/jpillora/node-glob-all#usage
export function findAll(globs: string | string[], cwd: string): string[] {
  const globArray = Array.isArray(globs) ? globs : [globs]
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return globAll.sync(globArray, { cwd, realpath: true }) as string[]
}

export function resolvePaths(paths: string[], cwd: string) {
  return paths.map((override) => {
    if (path.isAbsolute(override)) {
      return override
    } else {
      return path.join(cwd, override)
    }
  })
}

export function assertExistence(paths: string[]) {
  for (const dir of paths) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Directory does not exist: ${dir}`)
    }
  }
}

export function loadAndParse(langFile: string) {
  const fileContent = String(fs.readFileSync(langFile))
  const extname = path.extname(langFile)
  let parsedContent: string
  if (extname === '.yaml' || extname === '.yml') {
    parsedContent = yaml.load(fileContent) as string
  } else {
    parsedContent = JSON.parse(fileContent)
  }
  return parsedContent
}

export function getRootPath() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const rootPath = __dirname.split('/node_modules')[0]
  return rootPath
}

export function resolvePathsUsingPackages(packages: string[], folderName: string) {
  const basePath = getRootPath()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const folders = globAll.sync(
    packages.map((item) => `${basePath}/node_modules/${item}`),
  ) as string[]
  const localesDirs = folders.reduce((acc: string[], curr: string) => {
    const dir = `${curr}/lib/${folderName}`
    if (fs.existsSync(dir)) {
      return [...acc, dir] as string[]
    }
    return acc
  }, [])
  return localesDirs
}
