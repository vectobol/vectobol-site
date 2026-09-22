document.addEventListener("DOMContentLoaded", () => {

    const trigger = 50;

    function updateHeader() {

        if (window.scrollY > trigger) {
            document.body.classList.add("header-scrolled");
        } else {
            document.body.classList.remove("header-scrolled");
        }

    }

    updateHeader();

    window.addEventListener("scroll", updateHeader);

});