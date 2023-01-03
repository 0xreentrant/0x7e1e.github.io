const context = self;
onmessage = (event) => {
    try {
        const uniqueRelativeLinks = event?.data;
        const prefetchedItems = uniqueRelativeLinks?.map((link) => {
            return fetch(link)
                .then((response) => response?.text())
                .then((html) => {
                return {
                    storageKey: `prpl-${link}`,
                    storageValue: html
                };
            })
                .catch((error) => {
                console.warn('[PRPL] Failed to prefetch page.', error);
            });
        });
        Promise.all(prefetchedItems)
            .then((response) => {
            context?.postMessage(response);
        })
            .catch((error) => {
            console.warn('[PRPL] Failed to prefetch pages.', error);
        });
    }
    catch (error) {
        console.warn('[PRPL] Failed to prefetch in worker', error);
    }
};
