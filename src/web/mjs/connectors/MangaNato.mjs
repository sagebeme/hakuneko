import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class MangaNato extends Connector {

    constructor() {
        super();
        super.id = 'manganato';
        super.label = 'Manganato';
        this.tags = ['manga', 'manhwa', 'manhua', 'english'];
        this.url = 'https://www.manganato.gg';
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
        const uri = new URL('/manga-list/latest-manga', this.url);
        uri.searchParams.set('page', page);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'div.list-comic-item-wrap a.list-story-item:not([target])');
        const seen = new Set();
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, request.url),
                title: element.getAttribute('title')?.trim() || element.textContent.trim()
            };
        }).filter(manga => {
            if(seen.has(manga.id)) {
                return false;
            }
            seen.add(manga.id);
            return true;
        });
    }

    async _getChapters(manga) {
        const slug = manga.id.split('/').filter(part => part).pop();
        const uri = new URL('/api/manga/' + slug + '/chapters?limit=-1', this.url);
        const request = new Request(uri, this.requestOptions);
        const { data } = await this.fetchJSON(request);
        return data.chapters.map(chapter => {
            return {
                id: manga.id + '/' + chapter.chapter_slug,
                title: chapter.chapter_name
            };
        }).reverse();
    }

    async _getPages(chapter) {
        const script = `
            new Promise(resolve => {
                resolve([...document.querySelectorAll('div.container-chapter-reader > img')].map(image => image.dataset.src || image.src));
            });
        `;
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        return Engine.Request.fetchUI(request, script);
    }
}
