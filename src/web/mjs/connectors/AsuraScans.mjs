import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class AsuraScans extends Connector {

    constructor() {
        super();
        super.id = 'asurascans';
        super.label = 'Asura Scans';
        this.tags = ['webtoon', 'manga', 'english'];
        this.url = 'https://asurascans.com';
        this.config = {
            throttle: {
                label: 'Throttle Requests [ms]',
                description: 'Enter the timespan in [ms] to delay consecutive HTTP requests.\nThe website may block you for too many consecutive requests.',
                input: 'numeric',
                min: 200,
                max: 10000,
                value: 500
            }
        };
    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const [ title ] = await this.fetchDOM(request, 'h1');
        return new Manga(this, uri.pathname, title.textContent.trim());
    }

    async _getMangas() {
        let mangaList = [];
        for(let page = 1, run = true; run; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangas.length > 0 ? mangaList.push(...mangas) : run = false;
            await this.wait(this.config.throttle.value);
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = new URL('/browse', this.url);
        uri.searchParams.set('page', page);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a[href^="/comics/"] h3');
        return data.map(element => {
            return {
                id: element.closest('a').getAttribute('href'),
                title: element.textContent.trim()
            };
        });
    }

    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a[href*="/chapter/"] span.font-medium');
        return data.map(element => {
            return {
                id: element.closest('a').getAttribute('href'),
                title: element.textContent.trim()
            };
        }).reverse();
    }

    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'img[data-page-index]');
        return data
            .sort((a, b) => parseInt(a.dataset.pageIndex) - parseInt(b.dataset.pageIndex))
            .map(element => element.src);
    }
}
