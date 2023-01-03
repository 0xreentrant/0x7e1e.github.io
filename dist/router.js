function extractQuery(tag) {
    const name = tag?.tagName?.toLowerCase();
    let attrQueries = '';
    for (let i = 0; i < tag?.attributes?.length; i++) {
        const { name: key, nodeValue: value } = tag?.attributes?.[i] || {};
        attrQueries = attrQueries?.concat(`[${key}="${value}"]`);
    }
    return `${name}${attrQueries}`;
}
function ignoreScript(script) {
    if (script?.tagName?.toLowerCase() !== 'script') {
        return;
    }
    return (script?.src?.endsWith(`/${"prefetch"}.js`) ||
        script?.src?.endsWith(`/${"router"}.js`) ||
        script?.getAttribute('dev') === '');
}
window?.addEventListener('popstate', (event) => {
    const [url, hash] = window?.location?.href?.split('#') || [];
    try {
        const [targetUrl] = event?.state?.url?.split('#') || [];
        const html = sessionStorage?.getItem(`prpl-${url}`);
        if (!html) {
            throw new Error(`No cached html for route ${url}`);
        }
        const parser = new DOMParser();
        const target = parser?.parseFromString(html, 'text/html');
        const currentMain = document?.querySelector('main');
        const targetMain = target?.querySelector('main');
        currentMain?.replaceWith(targetMain);
        const currentHeadTags = Array.from(document?.querySelector('head')?.children);
        const targetHeadTags = Array.from(target?.querySelector('head')?.children);
        currentHeadTags?.forEach((currentHeadTag) => {
            if (targetHeadTags?.some((targetHeadTag) => targetHeadTag?.isEqualNode(currentHeadTag)) ||
                ignoreScript(currentHeadTag)) {
                return;
            }
            document?.head?.querySelector(extractQuery(currentHeadTag))?.remove();
        });
        targetHeadTags?.forEach((targetHeadTag) => {
            if (currentHeadTags?.some((currentHeadTag) => currentHeadTag?.isEqualNode(targetHeadTag)) ||
                ignoreScript(targetHeadTag)) {
                return;
            }
            if (targetHeadTag?.tagName?.toLowerCase() === 'script') {
                const clonedScript = document?.createElement('script');
                clonedScript.src = targetHeadTag?.src;
                document?.head?.appendChild(clonedScript);
                return;
            }
            document?.head?.appendChild(targetHeadTag);
        });
        if (hash) {
            document.getElementById(hash)?.scrollIntoView();
        }
        if (!hash && url === targetUrl) {
            window?.scrollTo({ top: 0 });
        }
        dispatchEvent(new CustomEvent("prpl-render", { bubbles: true }));
        performance.mark("prpl-render-end");
    }
    catch (error) {
        window?.location?.assign(url);
        console.info('[PRPL] Routing natively. Reason:', error?.message);
    }
});
document?.addEventListener('click', (event) => {
    performance.mark("prpl-render-start");
    const anchor = event?.target?.closest('a:not([rel])');
    if (anchor && anchor?.target !== '_blank') {
        event?.preventDefault();
        const url = anchor?.href;
        const state = { url };
        try {
            history?.pushState(state, null, url);
            dispatchEvent(new PopStateEvent('popstate', { state }));
        }
        catch (error) {
            window?.location?.assign(url);
        }
    }
});
