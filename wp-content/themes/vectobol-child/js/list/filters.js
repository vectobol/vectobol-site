/* ==========================================================
   filters.js
   Filtering engine only
========================================================== */

let globalQuery = "";
let statusFilter = "";


/* ==========================================================
   SETTERS
========================================================== */

export function setGlobalQuery(value){

    globalQuery = String(value ?? "")
        .trim()
        .toLowerCase();

}

export function setStatusFilter(value){

    statusFilter = String(value ?? "");

}


/* ==========================================================
   NORMALIZATION
========================================================== */

function norm(value){

    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .trim()
        .toLowerCase();

}


/* ==========================================================
   FILTER ENGINE
========================================================== */
export function applyFilters(rows){

    if(!Array.isArray(rows))
        return [];

    const ui = {};

    document.querySelectorAll(".f").forEach(select => {

        ui[select.dataset.k] = select.value;

    });


    return rows.filter(row=>{

        /* -----------------------------
           dropdown filters
        ----------------------------- */

        for(const key in ui){

            const value = ui[key];

            if(!value)
                continue;

            if(norm(row[key]) !== norm(value))
                return false;

        }


        /* -----------------------------
           statut de la fiche
        ----------------------------- */

        if(statusFilter){

            const lang =
                window.VECTOBOL_I18N?.getLang?.() || "fr";

            const statusKey =
                `status_${lang}`;

            const hasContent =
                Boolean(row.has_ecology);


            /* -------------------------
               PAS DE FICHE
            ------------------------- */

            if(statusFilter === "none"){

                if(hasContent)
                    return false;

            }


            /* -------------------------
               STATUT DE LA FICHE
            ------------------------- */

            else {

                if(!hasContent)
                    return false;

                if(row[statusKey] !== statusFilter)
                    return false;

            }

        }


        /* -----------------------------
           global search
        ----------------------------- */

        if(globalQuery){

            const ok =
                Object.values(row).some(v =>

                    norm(v).includes(
                        norm(globalQuery)
                    )

                );

            if(!ok)
                return false;

        }


        return true;

    });

}

/* ==========================================================
   GETTERS
========================================================== */

export function getGlobalQuery(){

    return globalQuery;

}

export function getStatusFilter(){

    return statusFilter;

}