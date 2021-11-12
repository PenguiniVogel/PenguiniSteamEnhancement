module Listings {

    const enum MessageEventType {
        HEAD = '_PenguiniSteamEnhancement',
        BUY_IMMEDIATELY = 'BUY_IMMEDIATELY'
    }

    window.onmessage = (e) => {
        if (!e?.data?.length) return;
        if (e.data[0] != MessageEventType.HEAD) return;

        if (e.data[1] == MessageEventType.BUY_IMMEDIATELY) {
            console.log(e.data[2]);

            let aHref = <HTMLElement>document.querySelector(`a[href="${e.data[2]}"]`);

            aHref.click();

            setTimeout(() => {
                let inputSSA = <HTMLInputElement>document.getElementById('market_buynow_dialog_accept_ssa');

                inputSSA.checked = true;
                inputSSA.value = '1';

                document.getElementById('market_buynow_dialog_purchase').click();
            }, 150);
        }
    };

    export function init(): void {
        // add item activity if not present
        if (!document.getElementById('market_activity_section')) {
            addItemActivity();
        }

        // buy immediately
        setInterval(() => addBuyImmediately(), 1000);

        // hide account name
        hideAccountName();

        // hide billing address
        hideBillingAddress();
    }

    function addItemActivity(): void {
        let bodyScripts = document.querySelectorAll('body script:not([src])');
        let itemId: number;

        for (let i = 0, l = bodyScripts.length; i < l; i ++) {
            let scriptTag = bodyScripts.item(i);
            let functionString = scriptTag.innerHTML.match(/(Market_LoadOrderSpread\(.*\);)/gm);
            let matchedId = (functionString ?? [''])[0].match(/\d+/g);

            if (matchedId?.length > 0) {
                itemId = +matchedId[0];

                break;
            }
        }

        let listingDiv = document.querySelector('div.market_listing_iteminfo');
        let activityDiv = document.createElement('div');

        activityDiv.setAttribute('id', 'market_activity_section');
        activityDiv.innerHTML = `
<hr/>
<h3 class="market_activity_header">Recent activity</h3>
<div id="market_activity_block">
    <div id="market_activity_waiting_text">Waiting for new activity...</div>
    <div style="display: none;" class="market_activity_line_item ellipsis"></div>
    <div style="display: none;" class="market_activity_line_item ellipsis"></div>
    <div style="display: none;" class="market_activity_line_item ellipsis"></div>
</div>
<a data-for="activate-activity" style="display: none;" onclick="ItemActivityTicker.Start(${itemId});"></a>`;

        listingDiv.append(activityDiv);

        setTimeout(() => {
            let activator = <HTMLElement>document.querySelector('a[data-for="activate-activity"]');

            activator.click();

            try {
                activator.remove();
            } catch {
                // ignore
            }
        }, 150);
    }

    function addBuyImmediately(): void {
        let buttonContainers = document.querySelectorAll('div.market_listing_right_cell.market_listing_action_buttons');

        for (let i = 0, l = buttonContainers.length; i < l; i ++) {
            let buttonContainer = <HTMLElement>buttonContainers.item(i);

            if (buttonContainer?.getAttribute('data-adjusted') == 'true') continue;

            buttonContainer.setAttribute('data-adjusted', 'true');

            let aHrefOther = <HTMLElement>buttonContainer.querySelector('a[href]');

            if (!aHrefOther) continue;

            let newButton = document.createElement('div');

            newButton.setAttribute('class', 'market_listing_buy_button');

            newButton.innerHTML = `
<a onclick="window.postMessage(['${MessageEventType.HEAD}', '${MessageEventType.BUY_IMMEDIATELY}', '${aHrefOther.getAttribute('href').replace(/'/g, '\\\'')}'], '*');" class="item_market_action_button btn_green_white_innerfade btn_small">
    <span style="padding: 0 5px;">Buy Immediately</span>
</a>`;

            buttonContainer.append(newButton);
        }
    }

    function hideAccountName(): void {
        let accountNameElement = document.getElementById('market_buynow_dialog_myaccountname');
        let accountName = accountNameElement.innerText;

        accountNameElement.setAttribute('data-name', accountName);
        accountNameElement.setAttribute('style', 'cursor: pointer; text-decoration: underline;');

        accountNameElement.innerText = 'Click to show';

        accountNameElement.onclick = (e) => {
            accountNameElement.innerText = accountNameElement.getAttribute('data-name');
            accountNameElement.setAttribute('style', '');

            let rows = document.querySelectorAll('.market_dialog_billing_address_row');

            for (let i = 0, l = rows.length; i < l; i ++) {
                rows.item(i).setAttribute('style', '');
            }
        };
    }

    function hideBillingAddress(): void {
        let rows = document.querySelectorAll('.market_dialog_billing_address_row');

        for (let i = 0, l = rows.length; i < l; i ++) {
            rows.item(i).setAttribute('style', 'display: none;');
        }
    }

}

setTimeout(() => Listings.init(), 150);
