export function createPagination(

    container,
    currentPage,
    totalPages,
    onPageChange,
    pageSize = 10,
    onPageSizeChange = null
) {

         const t =
        window.VECTOBOL_I18N?.t
        ||
        ((key) => key);


    if (!container)
        return;



    const sizes = [
        10,
        20,
        50,
        100,
        "all"
    ];



    let html = `

<div class="vb-pagination-bar">


<div class="vb-pagination">

`;



    /*
    ==========================
    NAVIGATION
    ==========================
    */


    if (totalPages > 1) {


        html += `

<button data-page="prev">
‹
</button>

`;



        for (
            let i = 1;
            i <= totalPages;
            i++
        ) {


            html += `

<button 
data-page="${i}"
class="${i === currentPage ? 'active' : ''}">
${i}
</button>

`;

        }



        html += `

<button data-page="next">
›
</button>

`;

    }



    html += `

</div>



<div class="vb-page-size">

<label>
${t("pagination_show")}
</label>


<select class="vb-page-size-select">

`;



    sizes.forEach(size => {


        const selected =
            size === pageSize
            ? "selected"
            : "";


        html += `

<option 
value="${size}"
${selected}>

    ${
        size === "all"
        ? t("pagination_all")
        : size
    }

</option>

`;

    });



    html += `

</select>


</div>


</div>

`;



    container.innerHTML = html;




    /*
    ==========================
    PAGE BUTTON EVENTS
    ==========================
    */


    container
    .querySelectorAll(
        ".vb-pagination button"
    )
    .forEach(button => {



        button.addEventListener(
            "click",
            () => {



                let page =
                    button.dataset.page;



                if (page === "prev") {


                    page =
                    Math.max(
                        1,
                        currentPage - 1
                    );


                }


                else if (page === "next") {


                    page =
                    Math.min(
                        totalPages,
                        currentPage + 1
                    );


                }


                else {


                    page =
                    Number(page);

                }



                onPageChange(page);


            }
        );


    });





    /*
    ==========================
    PAGE SIZE EVENT
    ==========================
    */


    const select =
        container.querySelector(
            ".vb-page-size-select"
        );



    if (
        select &&
        onPageSizeChange
    ) {


        select.addEventListener(
            "change",
            () => {


                let value =
                    select.value;



                if (
                    value !== "all"
                ) {

                    value =
                    Number(value);

                }



                onPageSizeChange(
                    value
                );


            }
        );


    }


}