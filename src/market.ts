module Market {

    export function init(): void {
        // add the advanced code to the page
        initAdvancedPageNavigation();
    }

    function initAdvancedPageNavigation(): void {
        function g_pse_overriddenLoadMarketHistory(bForce: boolean): void {
            if (!bForce) return;

            g_bBusyLoadingMarketHistory = true;
            let elMyHistoryContents = $('tabContentsMyMarketHistory');
            new Ajax.Request('https://steamcommunity.com/market/myhistory', {
                method: 'get',
                parameters: {},
                onSuccess: (transport) => {
                    if (transport.responseJSON) {
                        let response = transport.responseJSON;

                        elMyHistoryContents.innerHTML = response.results_html;

                        MergeWithAssetArray(response.assets);
                        eval(response.hovers);

                        g_oMyHistory = new CAjaxPagingControls(
                            {
                                query: '',
                                total_count: response.total_count,
                                pagesize: response.pagesize,
                                prefix: 'tabContentsMyMarketHistory',
                                class_prefix: 'market'
                            }, 'https://steamcommunity.com/market/myhistory/'
                        );

                        g_oMyHistory.SetResponseHandler((response) => {
                            MergeWithAssetArray(response.assets);
                            eval(response.hovers);
                        });
                    }
                },
                onComplete: () => {
                    g_bBusyLoadingMarketHistory = false;

                    g_pse_initAdvancedPaging();
                }
            });
        }

        function g_pse_initAdvancedPaging(): void {
            function add(id: string, control: CAjaxPagingControls): void {
                let oMyPageControls = document.querySelector(`#${id}`);

                let pageControlInputIn = document.createElement('input');

                pageControlInputIn.setAttribute('type', 'number');
                pageControlInputIn.setAttribute('style', 'max-width: 80px;');

                oMyPageControls.appendChild(pageControlInputIn);

                pageControlInputIn.onkeydown = (e) => {
                    if (e.key == 'Enter' || e.code == 'Enter') {
                        g_pse_advancedPaging(pageControlInputIn.value, control);
                    }
                };
            }

            add('tabContentsMyActiveMarketListings_controls', g_oMyListings);
            add('tabContentsMyMarketHistory_controls', g_oMyHistory);
        }

        function g_pse_advancedPaging(iPage: any, oPagingControl: CAjaxPagingControls): void {
            // make sure number is valid, we subtract one as visual numeration != internal page number
            if (iPage == null || isNaN(iPage) || !isFinite(iPage) || +iPage - 1 < 0 || +iPage - 1 >= oPagingControl.m_cMaxPages) return;

            oPagingControl.GoToPage(+iPage - 1);
        }

        Util.injectScriptTag(`
${g_pse_initAdvancedPaging.toString()}

${g_pse_advancedPaging.toString()}

// Override LoadMarketHistory to avoid it jumping around
${g_pse_overriddenLoadMarketHistory.toString()}
LoadMarketHistory = g_pse_overriddenLoadMarketHistory;
LoadMarketHistory(true);
        `);

    }

}

setTimeout(() => Market.init(), 150);