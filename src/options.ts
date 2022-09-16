module Options {

    export const enum ID {
        ADVANCED_PAGE_NAVIGATION = 'advanced_page_navigation',
        CALCULATE_BUYORDER_SUMMARY = 'calculate_buyorder_summary',
        BUYORDER_CANCEL_CONFIRMATION = 'buyorder_cancel_confirmation',
        BUYORDER_SCROLLING = 'buyorder_scrolling',
        NEW_GRAPH = 'new_graph',
        FORCE_ITEM_ACTIVITY = 'force_item_activity',
        ADD_VIEW_ON_BUFF = 'add_view_on_buff',
        HIDE_ACCOUNT_DETAILS = 'hide_account_details',
        MERGE_ACTIVE_LISTINGS = 'merge_active_listings'
    }

    const DEFAULT_OPTIONS: {
        [key in ID]: boolean
    } = {
        'advanced_page_navigation': false,
        'calculate_buyorder_summary': true,
        'buyorder_cancel_confirmation': true,
        'buyorder_scrolling': true,
        'new_graph': true,
        'force_item_activity': false,
        'add_view_on_buff': false,
        'hide_account_details': true,
        'merge_active_listings': false
    };

    export let storedOptions: {
        [key in ID]: boolean
    } = {
        ...DEFAULT_OPTIONS
    };

    let tempSettings = Cookie.read('pse_settings');

    if (tempSettings) {
        let parsed: { [key in ID]: boolean } = JSON.parse(tempSettings);

        storedOptions = {
            ...DEFAULT_OPTIONS,
            ...parsed
        };
    } else {
        save();
    }

    export function save(): void {
        let temp: {
            [key in ID]: boolean
        } = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));

        for (let l_key of Object.keys(DEFAULT_OPTIONS)) {
            // make sure it is a boolean
            temp[l_key] = !!storedOptions[l_key];
        }

        Cookie.write('pse_settings', JSON.stringify(temp));

        console.debug('[PSE] Write Options:', temp);
    }

    console.debug('[PSE] Options:', storedOptions);

}
