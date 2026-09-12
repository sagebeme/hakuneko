import WordPressMangastream from './templates/WordPressMangastream.mjs';

export default class VioletScans extends WordPressMangastream {

    constructor() {
        super();
        super.id = 'violetscans';
        super.label = 'Violet Scans';
        this.tags = ['webtoon', 'english'];
        this.url = 'https://violetscans.org';
        this.path = '/comics/';
        this.querMangaTitleFromURI = 'h1.entry-title';
    }

    async _getMangas() {
        let mangaList = [];
        for(let page = 1, run = true; run; page++) {
            const mangas = await this._getMangasFromPage(page);
            mangas.length > 0 ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        const uri = page === 1 ? new URL(this.path, this.url) : new URL(this.path + 'page/' + page + '/', this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, 'a[href*="/comics/"][title]');
        const seen = new Set();
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, request.url),
                title: element.getAttribute('title').trim()
            };
        }).filter(manga => {
            if(seen.has(manga.id) || manga.id === this.path) {
                return false;
            }
            seen.add(manga.id);
            return true;
        });
    }

    async _getChapters(manga) {
        const uri = new URL(manga.id, this.url);
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, '#chapterlist li a[href]');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, request.url),
                title: element.querySelector('span.chapternum').textContent.replace(/\s+/g, ' ').trim()
            };
        }).reverse();
    }
}
