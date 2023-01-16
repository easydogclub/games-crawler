import Crawler from 'crawler'
import { get } from 'lodash'
import * as UrlParser from 'url'

const gameInfoUrl =
  'https://shipengliang.com/download/switch/switch-%e5%b0%bc%e4%ba%9a%e5%8d%a1%e8%92%99%e5%8e%86%e9%99%a9%e8%ae%b0-%e6%b8%b8%e6%88%8f%e4%b8%8b%e8%bd%bd.html'

getInfo(gameInfoUrl)

export function getInfo(url: string) {
  const c = getCrawler({
    callback: (error, res, done) => {
      if (error) {
        console.log(error)
      } else {
        const $ = res.$
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server

        const title = $('title').text().replace('| 时鹏亮的Blog', '').trim()
        const gameId = $(`a[href*="https://tinfoil.io"]`).text()
        const downloadPage = $(`.gameInfo a[href*="https://shipengliang.com/go/"]`).attr('href')

        console.table({
          gameId,
          title,
          downloadPage,
        })

        if (downloadPage) {
          getCTDownloadUrl(downloadPage)
        }
      }

      done()
    },
  })

  c.queue(url)
}

export function getCTDownloadUrl(url: string) {
  const c = getCrawler({
    callback: (error, res, done) => {
      if (error) {
        console.log(error)
      } else {
        const $ = res.$
        const url = $('a[href*="https://d.shipengliang.com/f/"]').attr('href')

        if (url) {
          CTDownloader.download(url)
        }

        done()
      }
    },
  })

  c.queue(url)
}

type ShareLinkParsedInfo = ReturnType<typeof parseShareLink>

const CTDownloader = {
  download(shareLink: string) {
    CTDownloader.getFileInfo(shareLink)
  },

  getFileInfo(shareLink: string) {
    const parse = parseShareLink(shareLink)
    const params = new URLSearchParams()
    params.append('path', parse.path)
    params.append('f', parse.f)
    params.append('passcode', parse.passcode)
    params.append('token', parse.token)
    params.append('r', parse.r)
    params.append('ref', parse.ref)

    const api_getfile = `${parse.host}?${params.toString()}`
    console.log(api_getfile)

    const c = getCrawler({
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        origin: 'https://d.shipengliang.com',
        referer: shareLink,
      },
      callback: (err, res, done) => {
        if (err) {
          console.log(err)
        } else {
          const json = JSON.parse(res.body as string)
          const filename = get(json, 'file.file_name')
        }

        done()
      },
    })

    c.queue(api_getfile)
  },
}

function parseShareLink(shareLink: string) {
  const u = UrlParser.parse(shareLink)
  const filecode = u.pathname?.replace('/f/', '')
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const res = {
    host: 'https://webapi.ctfile.com/getfile.php',
    type: 'file',
    path: 'f',
    f: filecode || '',
    passcode: '',
    token,
    r: String(Math.random()),
    ref: '',
  }

  return res
}

function getCrawler(options: Crawler.CreateCrawlerOptions) {
  return new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    ...options,
  })
}
