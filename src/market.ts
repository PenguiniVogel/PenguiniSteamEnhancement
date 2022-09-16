module Market {

    import storedOptions = Options.storedOptions;

    export function init(): void {
        // add options
        addOptions();

        // add modal
        Modal.initModal();

        // add the advanced code to the page
        if (storedOptions[Options.ID.ADVANCED_PAGE_NAVIGATION]) {
            initAdvancedPageNavigation();
        }

        /**
         * Thanks to 6matko <br>
         * https://github.com/6matko
         */
        // calculate buy orders and adding information to the page
        if (storedOptions[Options.ID.CALCULATE_BUYORDER_SUMMARY]) {
            calculateBuyOrderSummary();
        }

        // add buy order cancel confirmation
        if (storedOptions[Options.ID.BUYORDER_CANCEL_CONFIRMATION]) {
            globals.addBuyOrderCancelConfirmation();
        }

        // add buy order scrolling
        if (Options.ID.BUYORDER_SCROLLING) {
            addBuyOrderScrolling();
        }
    }

    function addOptions(): void {
        window.addEventListener('message', (e) => {
            if ((e.data ?? [''])[0] == 'pse_option') {
                let key = (e.data ?? ['pse_option', 'null', false])[1];
                let value = (e.data ?? ['pse_option', 'null', false])[2];

                console.debug(e.data, key, value);

                if (Object.keys(storedOptions).indexOf(key) > -1) {
                    storedOptions[key] = !!value;
                    Options.save();
                }
            }
        });

        let moreInfo = <HTMLElement>document.querySelector('#moreInfo');

        let optionsDiv = document.createElement('div');
        optionsDiv.setAttribute('class', 'market_search_sidebar_contents');

        optionsDiv.innerHTML = `<div style="font-weight: 700;">PSE Options:</div>`;

        function createCheckboxOption(key: string, text: string): void {
            let optionDiv = document.createElement('div');

            optionDiv.innerHTML = `<label for="pse_option_${key}">${text}:</label><input id="pse_option_${key}" type="checkbox" ${storedOptions[key] ? 'checked' : ''} onclick="window.postMessage(['pse_option', '${key}', this.checked], '*');"/>`;

            optionsDiv.appendChild(optionDiv);
        }

        createCheckboxOption(Options.ID.ADVANCED_PAGE_NAVIGATION, 'Advanced Page Navigation');
        createCheckboxOption(Options.ID.CALCULATE_BUYORDER_SUMMARY, 'Calculate BuyOrder Summary');
        createCheckboxOption(Options.ID.BUYORDER_CANCEL_CONFIRMATION, 'BuyOrder Cancel Confirmation');
        createCheckboxOption(Options.ID.BUYORDER_SCROLLING, 'BuyOrder Scrolling');
        createCheckboxOption(Options.ID.NEW_GRAPH, 'New Graph');
        createCheckboxOption(Options.ID.FORCE_ITEM_ACTIVITY, 'Force Item Activity');
        createCheckboxOption(Options.ID.ADD_VIEW_ON_BUFF, 'Add "View on Buff"');
        createCheckboxOption(Options.ID.HIDE_ACCOUNT_DETAILS, 'Hide Account Details');
        createCheckboxOption(Options.ID.MERGE_ACTIVE_LISTINGS, 'Merge Active Listings');

        moreInfo.appendChild(optionsDiv);
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

        InjectionServiceLib.injectCode(`
${g_pse_initAdvancedPaging.toString()}
${g_pse_advancedPaging.toString()}
// Override LoadMarketHistory to avoid it jumping around
${g_pse_overriddenLoadMarketHistory.toString()}
LoadMarketHistory = g_pse_overriddenLoadMarketHistory;
LoadMarketHistory(true);
        `, 'body');

    }

    /**
     * Thanks to 6matko <br>
     * https://github.com/6matko
     */
    function calculateBuyOrderSummary() {

        /**
         * Creates header column element to insert into table
         *
         * @return {HTMLSpanElement} Returns column element with necessary classes and other settings
         */
        function createHeaderColumn(): HTMLSpanElement {
            let newHeaderColumn = document.createElement('span');
            // Adding necessary clases
            newHeaderColumn.classList.add('market_listing_right_cell');
            newHeaderColumn.classList.add('market_listing_my_price');
            newHeaderColumn.classList.add('market_listing_summary');
            newHeaderColumn.innerText = 'Summary';

            return newHeaderColumn;
        }

        function createSummaryColumn() {
            let summaryElement = document.createElement('div');
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
            let formatRegex = /,(?:--)?/g;
            let currentBalance = +(document.getElementById('marketWalletBalanceAmount').innerText.replace(currencySymbol, '').replace(formatRegex, '.'));

            // Getting max possible buy order balance. Limit is 10x current balance
            let maxBuyOrderBalance = currentBalance * 10;

            let buyOrderTable = document.querySelectorAll('.my_listing_section.market_content_block.market_home_listing_table')[1];
            // Creating header column
            let newHeaderColumn = createHeaderColumn();
            // Adding header column to table
            buyOrderTable.children[1].insertBefore(newHeaderColumn, buyOrderTable.children[1].children[1]);

            // Walking through every buy order row an d adding empty column for summary.
            // Adding it here because otherwise there will be issues during calculation (since elements alter)
            for (let i = 2; i < buyOrderTable.children.length; i++) {
                // Creating element for new column in buy order row
                let newSummaryColumn = createSummaryColumn();
                const rowElement = buyOrderTable.children[i];
                rowElement.insertBefore(newSummaryColumn, rowElement.children[2]);
            }

            // Getting list of elements with price class. Those are quantity & price (and our summary column)
            let priceList = buyOrderTable.getElementsByClassName('market_listing_price') as HTMLCollectionOf<HTMLDivElement>;

            let totalSum = 0;

            // Adding +1 to length because we are ignoring all 3rd elements
            // and going backwards to get price and quantity. Therefore we need this +1 to guarantee
            // that last element won't be left out
            for (let i = 0; i < priceList.length + 1; i++) {
                // Since we have our custom summary column in markup, it appears in array
                // as 0, 3, 6 (3rd) element. We are performing calculation when we hit our custom column
                // because we know that two previous elements are quantity and price
                if (i != 0 && !(i % 3)) {
                    let price = +(priceList[i - 2].innerText.replace(currencySymbol, '').replace(formatRegex, '.'));
                    // Total price for buy order row (price * quantity)
                    let totalForRow = +(price * (+priceList[i - 1].innerText));
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
            let currencyInMarkup = +(document.querySelector('[data-currency]').getAttribute('data-currency'));

            // Getting symbol from our currency list
            let currencySymbol = Currency.STEAM_CURRENCIES.filter(c => c.currencyId == currencyInMarkup)[0].symbol;
            // Setting buy order summary for display
            setBOSummary(currencySymbol);
        } catch (error) {
            console.debug('[PSE] Something went wrong during buy order summary calculation');
            console.error(error);
        }
    }

    function addBuyOrderScrolling(): void {
        let buyOrderTable = document.querySelectorAll('.my_listing_section.market_content_block.market_home_listing_table')[1];

        buyOrderTable.setAttribute('style', 'max-height: 530px; overflow-y: auto;');

        let customScrollStyle = `          
            /* width */
            .my_listing_section.market_content_block.market_home_listing_table::-webkit-scrollbar {
                width: 10px;
            }
            
            /* track */
            .my_listing_section.market_content_block.market_home_listing_table::-webkit-scrollbar-track {
                background: #1b2838;
            }
            
            /* handle */
            .my_listing_section.market_content_block.market_home_listing_table::-webkit-scrollbar-thumb {
                border-radius: 5px;
                background: #000f18;
            }
            
            /* handle on hover */
            .my_listing_section.market_content_block.market_home_listing_table::-webkit-scrollbar-thumb:hover {
                background: #001f33;
            }
        `;

        InjectionServiceLib.injectCSS(customScrollStyle);
    }

}

InjectionServiceLib.onReady(() => setTimeout(() => Market.init(), 150));
