export function getSpeciesSlug(row) {
  return row?.slug ??
         row?.species ??
         row?.species_name ??
         row?.taxon_slug ??
         null;
}