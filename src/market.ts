module Market {

    export function init(): void {
        // add the advanced code to the page
        initAdvancedPageNavigation();
        // calculate buy orders and adding information to the page
        calculateBuyOrderSummary();
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

    function calculateBuyOrderSummary() {
        /**
         * Creates header column element to insert into table
         *
         * @return {HTMLSpanElement} Returns column element with necessary classes and other settings
         */
        function createHeaderColumn(): HTMLSpanElement {
            var newHeaderColumn = document.createElement('span');
            // Adding necessary clases
            newHeaderColumn.classList.add('market_listing_right_cell');
            newHeaderColumn.classList.add('market_listing_my_price');
            newHeaderColumn.classList.add('market_listing_summary');
            newHeaderColumn.innerText = 'Summary';
            return newHeaderColumn;
        }

        function createSummaryColumn() {
            var summaryElement = document.createElement('div');
            // Adding necessary classes for proper display
            summaryElement.className = 'market_listing_right_cell market_listing_my_price market_listing_buyorder_summary';
            // Adding structure that is used for other columns
            summaryElement.innerHTML = `
            <span class="market_table_value">
                <span class="market_listing_price">
                </span>
            </span>
            `;
            return summaryElement;
        }

        function setBOSummary(currencySymbol: string) {
            var currentBalance = +document.getElementById('marketWalletBalanceAmount')
                .innerText.replace(currencySymbol, '').replace(',--', '').replace(',', '.');

            // Getting max possible buy order balance. Limit is 10x current balance
            var maxBuyOrderBalance = currentBalance * 10;

            var buyOrderTable = document.querySelectorAll('.my_listing_section.market_content_block.market_home_listing_table')[1];
            // Creating header column
            var newHeaderColumn = createHeaderColumn();
            // Adding header column to table
            buyOrderTable.children[1].insertBefore(newHeaderColumn, buyOrderTable.children[1].children[1]);

            // Walking through every buy order row an d adding empty column for summary.
            // Adding it here because otherwise there will be issues during calculation (since elements alter)
            for (let i = 2; i < buyOrderTable.children.length; i++) {
                // Creating element for new column in buy order row
                var newSummaryColumn = createSummaryColumn();
                const rowElement = buyOrderTable.children[i];
                rowElement.insertBefore(newSummaryColumn, rowElement.children[2]);
            }

            // Getting list of elements with price class. Those are quantity & price (and our summary column)
            var priceList = buyOrderTable.getElementsByClassName('market_listing_price') as HTMLCollectionOf<HTMLDivElement>;

            var totalSum = 0;

            // Adding +1 to length because we are ignoring all 3rd elements
            // and going backwards to get price and quantity. Therefore we need this +1 to guarantee
            // that last element won't be left out
            for (let i = 0; i < priceList.length + 1; i++) {
                // Since we have our custom summary column in markup, it appears in array
                // as 0, 3, 6 (3rd) element. We are performing calculation when we hit our custom column
                // because we know that two previous elements are quantity and price
                if (i !== 0 && !(i % 3)) {
                    var price = +priceList[i - 2].innerText.replace(currencySymbol, '').replace(',--', '').replace(',', '.');
                    // Total price for buy order row (price * quantity)
                    var totalForRow = +(price * (+priceList[i - 1].innerText));
                    // Adding to global total sum
                    totalSum += totalForRow;

                    // Setting our summary for display.
                    // NOTE: If users max buy order limit is lower than global price sum then value will be
                    // displayed as red. Until user's limit is not exceeded value will be green
                    priceList[i - 3].innerHTML = `
                    <div>${totalForRow.toFixed(2)}${currencySymbol}</div>
                    <div style="border-top: 1px solid; color: ${maxBuyOrderBalance > totalSum ? 'green' : 'red'};">
                    ${totalSum.toFixed(2)}${currencySymbol}
                    </div>
                    `;
                }
            }

            buyOrderTable.children[0].insertAdjacentHTML('beforeend', `
            <span class="my_market_header_count">
                Placed: <span style="color: ${maxBuyOrderBalance > totalSum ? 'green' : 'red'};">${totalSum.toFixed(2)}${currencySymbol}</span> / Max limit: ${maxBuyOrderBalance.toFixed(2)}${currencySymbol}
            </span>
            `);
        }

        try {
            // Getting information about currency from markup. This information can be found in data attributes
            var currencyInMarkup = +(document.getElementsByTagName('html')[0].querySelector('[data-currency]') as HTMLElement)?.dataset?.currency;

            // Getting symbol from our currency list
            var currencySymbol = Currency.CURRENCY.filter(c => c.currencyId === currencyInMarkup)[0].symbol;
            // Setting buy order summary for display
            setBOSummary(currencySymbol);
        } catch (error) {
            console.log(`Something went wrong during buy order summary calculation`);
            console.log(error);
        }
    }
}

setTimeout(() => Market.init(), 150);