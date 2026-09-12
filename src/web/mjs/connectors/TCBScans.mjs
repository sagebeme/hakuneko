import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class TCBScans extends Connector {

    constructor() {
        super();
        super.id = 'tcbscans';
        super.label = 'TCB Scans';
        this.tags = ['manga', 'english'];
        this.url = 'https://tcbonepiecechapters.com';
    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const [ title ] = await this.fetchDOM(request, 'h1');
        return new Manga(this, uri.pathname, title.textContent.trim());
    }

    async _getMangas() {
        const uri = new URL('/projects', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a[href^="/mangas/"]');
        // each manga card has two separate anchors to the same url (cover image + title text)
        const mangas = new Map();
        data.forEach(element => {
            const title = element.textContent.trim() || element.querySelector('img')?.alt?.trim();
            if(title) {
                mangas.set(element.getAttribute('href'), {
                    id: element.getAttribute('href'),
                    title: title
                });
            }
        });
        return [...mangas.values()];
    }

    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a[href^="/chapters/"]');
        return data.map(element => {
            return {
                id: element.getAttribute('href'),
                title: element.textContent.replace(/\s+/g, ' ').trim()
            };
        }).reverse();
    }

    async _getPages(chapter) {
        const uri = new URL(chapter.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'picture img');
        return data.map(element => element.src);
    }
}
