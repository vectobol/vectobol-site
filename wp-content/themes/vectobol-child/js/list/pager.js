/* ==========================================================
   pager.js
   Pagination helper
========================================================== */

export function paginate(rows = [], page = 1, pageSize = 10) {

  if (!Array.isArray(rows)) {
    rows = [];
  }

  /* ---------------------------------------
     page size
  --------------------------------------- */

  let size;

  if (pageSize === "all") {
    size = Math.max(rows.length, 1);
  } else {
    size = Math.max(Number(pageSize) || 10, 1);
  }

  /* ---------------------------------------
     total pages
  --------------------------------------- */

  const totalRows = rows.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRows / size)
  );

  /* ---------------------------------------
     safe page
  --------------------------------------- */

  const currentPage = Math.min(
    Math.max(Number(page) || 1, 1),
    totalPages
  );

  /* ---------------------------------------
     slice
  --------------------------------------- */

  const start = (currentPage - 1) * size;

  const end = start + size;

  return {

    page: currentPage,

    pageSize: size,

    totalRows,

    totalPages,

    slice: rows.slice(start, end)

  };

}