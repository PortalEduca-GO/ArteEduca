


export function createPageUrl(pageName: string) {
    if (!pageName) {
        return '/';
    }

    const [pathPart, queryPart] = pageName.split('?');
    const normalizedPath = '/' + pathPart.toLowerCase().replace(/ /g, '-');

    return queryPart ? `${normalizedPath}?${queryPart}` : normalizedPath;
}