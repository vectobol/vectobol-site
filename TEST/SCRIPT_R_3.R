url <- "https://redcap.ird.fr/api/"

token <- "72E455D1C76**************"


library(httr)
library(purrr)
library(dplyr)
library(readr)
library(curl)
library(stringr)
library(yaml)

config <- yaml::read_yaml("config/config.yml")


formData <- list(
  token = token,
  content = "record",
  action = "export",
  format = "json",
  type = "flat",
  
  `forms[0]` = "datos_de_terreno",
  `forms[1]` = "especies",
  
  rawOrLabel = "label",
  rawOrLabelHeaders = "raw",
  
  exportCheckboxLabel = "false",
  exportSurveyFields = "false",
  exportDataAccessGroups = "false",
  
  returnFormat = "json"
)

response <- httr::POST(
  url,
  body = formData,
  encode = "form"
)

result <- httr::content(response)
############################################################
# TRANSFORMATION DE LA REPONSE REDCAP EN DATAFRAME
############################################################

result_df <- purrr::map(
  result,
  ~ data.frame(
    record_id = as.character(.x$record_id),
    
    redcap_repeat_instrument =
      as.character(.x$redcap_repeat_instrument),
    
    redcap_repeat_instance =
      as.character(.x$redcap_repeat_instance),
    
    sample_id = as.character(.x$sample_id),
    
    sample_latitude =
      as.character(.x$sample_latitude),
    
    sample_longitude =
      as.character(.x$sample_longitude),
    
    sample_altitude =
      as.character(.x$sample_altitude),
    
    sample_admin1 =
      as.character(.x$sample_admin1),
    
    sample_admin2 =
      as.character(.x$sample_admin2),
    
    sample_admin3 =
      as.character(.x$sample_admin3),
    
    genus =
      as.character(.x$genus),
    
    subgenus =
      as.character(.x$subgenus),
    
    species =
      as.character(.x$species),
    
    stringsAsFactors = FALSE
  )
)

result_df <- dplyr::bind_rows(result_df)


############################################################
# TRANSFORMATION DES CHAMPS VIDES EN NA
############################################################

result_df <- dplyr::mutate(
  result_df,
  dplyr::across(
    dplyr::everything(),
    ~ dplyr::na_if(.x, "")
  )
)







############################################################
# CONTROLE 1 : DOUBLONS GENRE + ESPECE
# Un même couple genre + espèce ne doit apparaître
# qu'une seule fois dans un même point de collecte
############################################################

species_df <- result_df %>%
  dplyr::filter(
    redcap_repeat_instrument == "Especies"
  )

############################################################
# RECHERCHE DES DOUBLONS
############################################################

duplicates <- species_df %>%
  dplyr::filter(
    !is.na(genus),
    !is.na(species)
  ) %>%
  dplyr::group_by(
    record_id,
    genus,
    species
  ) %>%
  dplyr::filter(
    dplyr::n() > 1
  ) %>%
  dplyr::ungroup() %>%
  dplyr::select(
    record_id,
    redcap_repeat_instance,
    sample_id,
    genus,
    subgenus,
    species
  )

############################################################
# RESULTAT
############################################################

if (nrow(duplicates) == 0) {
  
  cat("\n✓ Aucun doublon genre + espèce détecté.\n")
  
} else {
  
  cat(
    "\n⚠ DOUBLONS GENRE + ESPECE DETECTES :",
    nrow(duplicates),
    "occurrences concernées.\n\n"
  )
  
  print(duplicates)
  
}









############################################################
# REFERENTIEL TAXONOMIQUE VECTOBOL
# RÉCUPÉRATION DEPUIS OVH / FTP
############################################################

host_clean <- config$ftp$host |>
  stringr::str_replace("^ftp://", "") |>
  stringr::str_replace("/$", "")


remote_taxa_url <- paste0(
  "ftp://",
  host_clean,
  "/",
  config$paths$remote_taxa_reference
)


cat(
  "\nRécupération du référentiel VECTOBOL depuis :\n",
  remote_taxa_url,
  "\n"
)


############################################################
# TÉLÉCHARGEMENT TEMPORAIRE
############################################################

taxa_local_file <- tempfile(
  fileext = ".csv"
)


handle <- curl::new_handle(
  username = config$ftp$user,
  password = config$ftp$pass
)


curl::curl_download(
  url = remote_taxa_url,
  destfile = taxa_local_file,
  handle = handle
)


############################################################
# LECTURE
############################################################

taxa_reference <- readr::read_csv(
  taxa_local_file,
  show_col_types = FALSE,
  na = c("", "NA")
)


############################################################
# VERIFICATION
############################################################

cat("\n========================================\n")
cat("REFERENTIEL VECTOBOL\n")
cat("========================================\n\n")

cat(
  "Nombre de taxons :",
  nrow(taxa_reference),
  "\n\n"
)

cat("Colonnes :\n")
print(names(taxa_reference))

cat("\nPremières lignes :\n")
print(head(taxa_reference))










############################################################
# CONTROLE 2 : CORRESPONDANCE AVEC VB-TAXA
#
# Le couple GENRE + ESPECE doit exister dans VECTOBOL.
# Le sous-genre n'est PAS utilisé comme critère obligatoire.
############################################################


############################################################
# PREPARATION DU REFERENTIEL VECTOBOL
############################################################

taxa_reference <- taxa_reference |>
  dplyr::mutate(
    
    genus_key =
      stringr::str_to_lower(
        stringr::str_squish(genus)
      ),
    
    species_key =
      stringr::str_to_lower(
        stringr::str_squish(species)
      ),
    
    taxon_match_key =
      paste(
        genus_key,
        species_key,
        sep = "_"
      )
  )


############################################################
# PREPARATION DES OCCURRENCES REDCAP
############################################################

species_check <- species_df |>
  dplyr::filter(
    !is.na(genus),
    !is.na(species)
  ) |>
  dplyr::mutate(
    
    genus_key =
      stringr::str_to_lower(
        stringr::str_squish(genus)
      ),
    
    species_key =
      stringr::str_to_lower(
        stringr::str_squish(species)
      ),
    
    taxon_match_key =
      paste(
        genus_key,
        species_key,
        sep = "_"
      )
  )


############################################################
# CORRESPONDANCE
############################################################

species_check <- species_check |>
  dplyr::left_join(
    
    taxa_reference |>
      dplyr::select(
        taxon_match_key,
        id,
        taxon_key,
        genus_key,
        species_key,
        genus_vb = genus,
        subgenus_vb = subgenus,
        species_vb = species
      ),
    
    by = "taxon_match_key"
    
  )

############################################################
# TAXONS NON TROUVES
############################################################

unknown_taxa <- species_check |>
  dplyr::filter(
    is.na(id)
  ) |>
  dplyr::select(
    record_id,
    redcap_repeat_instance,
    genus,
    species,
    subgenus
  )


############################################################
# RESULTAT
############################################################

if (nrow(unknown_taxa) == 0) {
  
  cat(
    "\n✓ Tous les couples genre + espèce de REDCap ",
    "existent dans VECTOBOL.\n"
  )
  
} else {
  
  cat(
    "\n⚠ TAXONS REDCAP ABSENTS DE VECTOBOL : ",
    nrow(unknown_taxa),
    "occurrences concernées.\n\n"
  )
  
  print(
    unknown_taxa
  )
  
}









############################################################
# VERIFICATIONS GENERALES
############################################################

cat("\n========================================\n")
cat("VERIFICATION DU DATASET REDCAP\n")
cat("========================================\n\n")

cat("Nombre de lignes :", nrow(result_df), "\n")
cat("Nombre de colonnes :", ncol(result_df), "\n\n")


############################################################
# REPARTITION DES ENREGISTREMENTS
############################################################

cat("Formulaires / répétitions :\n")

print(
  table(
    result_df$redcap_repeat_instrument,
    useNA = "ifany"
  )
)


############################################################
# NOMBRE DE POINTS DE COLLECTE
############################################################

cat("\nNombre de points de collecte : ")

print(
  dplyr::n_distinct(
    result_df$record_id
  )
)


############################################################
# NOMBRE D'OCCURRENCES ESPECES
############################################################

species_df <- result_df %>%
  dplyr::filter(
    redcap_repeat_instrument == "Especies"
  )

cat("\nNombre d'occurrences Especies : ")
print(nrow(species_df))


############################################################
# NOMBRE D'ESPECES PAR POINT
############################################################

cat("\nNombre d'espèces par point de collecte :\n")

species_per_record <- species_df %>%
  dplyr::count(record_id, name = "n_species")

print(
  summary(species_per_record$n_species)
)


############################################################
# APERCU
############################################################

cat("\nAperçu des données :\n\n")

print(
  result_df %>%
    dplyr::select(
      record_id,
      redcap_repeat_instrument,
      redcap_repeat_instance,
      sample_id,
      genus,
      subgenus,
      species
    ) %>%
    head(20)
)




############################################################
# VERIFICATIONS
############################################################

dim(result_df)

table(result_df$redcap_repeat_instrument)