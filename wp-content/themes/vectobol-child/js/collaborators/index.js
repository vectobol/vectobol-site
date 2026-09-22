import { loadCollaborators } from "./api.js";
import { createTable } from "./table.js";
import { createPagination } from "./pagination.js";



const state = {

    collaborators: [],

    filtered: [],

    search: "",

    role: "",

    rowsPerPage: 10,

    currentPage: 1

};



let container;


    const t =
        window.VECTOBOL_I18N?.t
        ||
        ((key) => key);



function filterData() {


    state.filtered =
        state.collaborators.filter(c => {


            let okSearch = true;
            let okRole = true;



            if (state.search) {


                const text =
                    JSON.stringify(c)
                    .toLowerCase();


                okSearch =
                    text.includes(
                        state.search
                    );

            }



            if (state.role) {


                okRole =
                    c.roles &&
                    c.roles[state.role] === true;

            }



            return okSearch && okRole;


        });


}



function render() {


    filterData();

      updateCounter();

    const totalPages =
        state.rowsPerPage === "all"
        ? 1
        :
        Math.ceil(
            state.filtered.length /
            state.rowsPerPage
        );



    if (state.currentPage > totalPages)
        state.currentPage = totalPages || 1;



    let rows =
        state.filtered;



    if (state.rowsPerPage !== "all") {


        const start =
            (state.currentPage - 1)
            *
            state.rowsPerPage;



        rows =
            state.filtered.slice(
                start,
                start + state.rowsPerPage
            );

    }



    createTable(
        container,
        rows
    );



    const top =
        document.getElementById(
            "vb-collaborators-pagination-top"
        );


    const bottom =
        document.getElementById(
            "vb-collaborators-pagination-bottom"
        );



    createPagination(
        top,
        state.currentPage,
        totalPages,
        changePage,
        state.rowsPerPage,
        changeRowsPerPage
    );


    createPagination(
        bottom,
        state.currentPage,
        totalPages,
        changePage,
        state.rowsPerPage,
        changeRowsPerPage
    );



}

function updateCounter() {


    const total =
        document.getElementById(
            "vb-collaborators-total"
        );


    const filtered =
        document.getElementById(
            "vb-collaborators-filtered"
        );



    if (total) {

        total.textContent =
        `${t("collaborators_total")} : ${state.collaborators.length}`;

    }



    if (filtered) {

        filtered.textContent =
         `${t("collaborators_filtered")} : ${state.filtered.length}`;

    }


}

function changePage(page) {


    state.currentPage = page;

    render();

}

function changeRowsPerPage(value) {


    state.rowsPerPage = value;

    state.currentPage = 1;

    render();

}

function attachEvents() {


    const search =
        document.getElementById(
            "vb-collaborators-search"
        );


        if (search) {

            search.placeholder =
                t("collaborators_search_placeholder");

        
            search.oninput = () => {


            state.search =
                search.value
                .toLowerCase()
                .trim();


            state.currentPage = 1;

            render();

        };


        const reset =
            document.getElementById(
                "vb-collaborators-reset"
            );


        if (reset) {


            reset.onclick = () => {


                state.search = "";

                state.role = "";

                state.currentPage = 1;



                const search =
                    document.getElementById(
                        "vb-collaborators-search"
                    );


                if (search)
                    search.value = "";



                const role =
                    document.getElementById(
                        "vb-collaborators-role-filter"
                    );


                if (role)
                    role.value = "";



                render();


            };

        }

    }



    const role =
        document.getElementById(
            "vb-collaborators-role-filter"
        );


    if (role) {


        role.onchange = () => {


            state.role =
                role.value;


            state.currentPage = 1;


            render();

        };

    }



}



async function init() {


    container =
        document.getElementById(
            "vectobol-collaborators-table"
        );


    if (!container)
        return;



    state.collaborators =
        await loadCollaborators();



    state.filtered =
        state.collaborators;



    render();



    attachEvents();


}



init();