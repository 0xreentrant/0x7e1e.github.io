function getRelativePaths() {
    const relativePaths = [
        ...Array.from(document?.querySelectorAll('a:not([rel])'))
            .filter((link) => link?.href?.includes(window?.location?.origin))
            .map((link) => link?.href)
    ];
    return Array.from(new Set(relativePaths));
}
if (window.Worker) {
    const prefetchWorker = new Worker('prefetch-worker.js', { type: 'module' });
    prefetchWorker?.postMessage([window?.location?.href, ...getRelativePaths()]);
    prefetchWorker.onmessage = (event) => {
        const prefetchedPages = event?.data;
        for (let i = 0; i < prefetchedPages?.length; i++) {
            const { storageKey, storageValue } = prefetchedPages?.[i] || {};
            if (!storageKey || !storageValue) {
                return;
            }
            sessionStorage?.setItem(storageKey, storageValue);
        }
    };
    window.addEventListener("prpl-render", () => {
        try {
            prefetchWorker?.postMessage(getRelativePaths());
        }
        catch (error) {
            console.info('[PRPL] Failed to prefetch on subsequent page route. Error:', error);
        }
    });
}
else {
    console.info(`[PRPL] Your browser doesn't support web workers.`);
}
