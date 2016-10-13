const Immutable = require('immutable');

const timing = require('../utils/timing');
const Page = require('../models/page');
const walkSummary = require('./walkSummary');
const parsePage = require('./parsePage');


/**
 * Parse a page from a path
 *
 * @param {Book} book
 * @param {String} filePath
 * @return {Page?}
 */
function parseFilePage(book, filePath) {
    const fs = book.getContentFS();

    return fs.statFile(filePath)
    .then(
        function(file) {
            const page = Page.createForFile(file);
            return parsePage(book, page);
        },
        function(err) {
            // file doesn't exist
            return null;
        }
    )
    .fail(function(err) {
        const logger = book.getLogger();
        logger.error.ln('error while parsing page "' + filePath + '":');
        throw err;
    });
}


/**
 * Parse all pages from a book as an OrderedMap
 *
 * @param {Book} book
 * @return {Promise<OrderedMap<Page>>}
 */
function parsePagesList(book) {
    const summary = book.getSummary();
    const glossary = book.getGlossary();
    let map = Immutable.OrderedMap();

    // Parse pages from summary
    return timing.measure(
        'parse.listPages',
        walkSummary(summary, function(article) {
            if (!article.isPage()) return;

            const filepath = article.getPath();

            // Is the page ignored?
            if (book.isContentFileIgnored(filepath)) return;

            return parseFilePage(book, filepath)
            .then(function(page) {
                // file doesn't exist
                if (!page) {
                    return;
                }

                map = map.set(filepath, page);
            });
        })
    )

    // Parse glossary
    .then(function() {
        const file = glossary.getFile();

        if (!file.exists()) {
            return;
        }

        return parseFilePage(book, file.getPath())
        .then(function(page) {
            // file doesn't exist
            if (!page) {
                return;
            }

            map = map.set(file.getPath(), page);
        });
    })

    .then(function() {
        return map;
    });
}


module.exports = parsePagesList;
