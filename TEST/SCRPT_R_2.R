############################################################
# VECTOBOL PIPELINE - FUSION MODEL (ROBUST VERSION)
############################################################

library(tidyverse)
library(readr)
library(lubridate)
library(jsonlite)
library(httr)
library(curl)
library(yaml)
library(stringr)
library(purrr)

############################################################
# CONFIG
############################################################

config <- yaml::read_yaml("config/config.yml")

WP_TOKEN     <- config$wp$token
WP_FLUSH_URL <- config$wp$flush_url
out_dir      <- config$paths$output_dir

############################################################
# INPUTS
############################################################

collectes_raw <- read_csv(file.path(config$paths$data_dir, "collectes_redcap.csv"),
                          show_col_types = FALSE)

species_raw <- read_csv(file.path(config$paths$data_dir, "species_redcap.csv"),
                        show_col_types = FALSE)

dict_values <- read_csv(file.path(config$paths$data_dir, "correspondance_values_redcap.csv"),
                        show_col_types = FALSE)

dict_vars <- read_csv(file.path(config$paths$data_dir, "correspondance_variables_redcap.csv"),
                      show_col_types = FALSE)

taxonomy <- fromJSON(
  config$paths$taxo_file,
  flatten = TRUE
)

############################################################
# CLEAN
############################################################

clean_chr <- function(df) {
  df %>%
    mutate(across(where(is.character), ~ str_squish(na_if(.x, ""))))
}

collectes_raw <- clean_chr(collectes_raw)
species_raw   <- clean_chr(species_raw)

############################################################
# DICTIONARIES (GENUS / SPECIES LABELS)
############################################################

genus_dict <- dict_values %>%
  filter(variable == "genus") %>%
  transmute(code, genus_label = value_en)

species_dict <- dict_values %>%
  filter(variable == "species") %>%
  transmute(code, species_label = value_en)

############################################################
# SPECIES CLEAN + KEY (LABEL-BASED)
############################################################

species_clean <- species_raw %>%
  left_join(genus_dict, by = c("genus" = "code")) %>%
  left_join(species_dict, by = c("species" = "code")) %>%
  mutate(
    genus_label   = str_to_lower(str_squish(genus_label)),
    species_label = str_to_lower(str_squish(species_label)),
    species_key   = paste0(genus_label, "_", species_label)
  ) %>%
  mutate(
    species_key = case_when(
      str_detect(species_key, "_na$") ~ NA_character_,
      str_detect(species_key, "sp$")  ~ paste0(genus_label, "_sp"),
      TRUE ~ species_key
    )
  )

############################################################
# TAXONOMY TABLE (SOURCE OF TRUTH)
############################################################

taxo_df <- taxonomy %>%
  transmute(
    species_key = tolower(str_squish(key)),
    
    genus     = tolower(taxonomy.genus),
    subgenus  = taxonomy.subgenus,
    species   = tolower(taxonomy.species),
    
    phylum    = taxonomy.phylum,
    class     = taxonomy.class,
    order     = taxonomy.order,
    family    = taxonomy.family,
    subfamily = taxonomy.subfamily,
    tribe     = taxonomy.tribe
  ) %>%
  mutate(species_key = tolower(species_key))

############################################################
# SITE DATA
############################################################

sites <- collectes_raw %>%
  mutate(
    initial_date = ymd_hms(initial_date, quiet = TRUE),
    
    date  = as.Date(initial_date),
    year  = year(initial_date),
    month = month(initial_date),
    day   = day(initial_date),
    
    latitude  = as.numeric(sample_latitude),
    longitude = as.numeric(sample_longitude),
    altitude  = round(as.numeric(sample_altitude), 0)
  ) %>%
  
   mutate(
    sample_admin1 = sample_admin1,
    sample_admin2 = sample_admin2,
    sample_admin3 = sample_admin3
  )

############################################################
# DEBUG COVERAGE
############################################################

cat("Taxonomy coverage:\n")
cat(sum(species_clean$species_key %in% taxo_df$species_key), "matches\n")



species_clean <- species_clean %>%
  mutate(
    genus = as.character(genus),
    species = as.character(species)
  )


############################################################
# FUSION DATASET
############################################################

dataset <- species_clean %>%
  mutate(
    genus = as.character(genus),
    species = as.character(species)
  ) %>%
  left_join(sites, by = "record_id") %>%
  left_join(taxo_df, by = "species_key", suffix = c("", "_taxo")) %>%
  mutate(
    genus    = genus_taxo,
    species  = species_taxo,
    subgenus = subgenus_taxo
  )

cat("Columns:\n")
print(names(dataset))




############################################################
# SAFETY CHECK (CRITICAL)
############################################################

dataset <- dataset %>%
  mutate(
    genus    = as.character(genus_taxo),
    species  = as.character(species_taxo),
    subgenus = as.character(subgenus_taxo)
  )

stopifnot(all(c("genus", "species") %in% names(dataset)))

############################################################
# FINAL EXPORT (sites.json = POINTS DE COLLECTE)
############################################################

sites_export <- sites %>%
  transmute(
    
    record_id,
    
    # GEO
    latitude,
    longitude,
    altitude,
    
    # ADMIN
    sample_admin1,
    sample_admin2,
    sample_admin3,
    
    # TIME
    date,
    year,
    month,
    day,
    
    # METADATA
    sample_id,
    mision_code
    
  )

names(sites_export) <- tolower(names(sites_export))



############################################################
# FINAL EXPORT (occurrences.json)
############################################################

occurrences_export <- dataset %>%
  transmute(
    
    record_id,
    
    # GEO
    latitude,
    longitude,
    altitude,
    
    # ADMIN
    sample_admin1,
    sample_admin2,
    sample_admin3,
    
    # TIME
    date,
    year,
    month,
    day,
    
    # TAXO
    species_key,
    genus,
    subgenus,
    species,
    
    phylum,
    class,
    order,
    family,
    subfamily,
    tribe,
    
    # METADATA
    identifiedby,
    identificationverificationstatus,
    
    # ECOLOGIE
    sample_type,
    sample_origen,
    sampling_method_ter,
    acuatic_location,
    artificial_container,
    artificial_container_flag = acuatic_location == 26,
    
    # IDS
    sample_id,
    mision_code
    
  )

names(occurrences_export) <- tolower(names(occurrences_export))






############################################################
# DICTIONARY EXPORT
############################################################

dictionary <- list(
  variables = dict_vars,
  values    = dict_values
)

############################################################
# STATS
############################################################

stats <- list(
  n_species     = n_distinct(na.omit(dataset$species_key)),
  n_genera      = n_distinct(na.omit(dataset$genus)),
  n_points      = n_distinct(sites$record_id),
  n_occurrences = nrow(dataset),
  last_update   = as.character(Sys.Date())
)

############################################################
# EXPORT JSON
############################################################

write_json(sites_export,
           file.path(out_dir, "sites.json"),
           pretty = TRUE, auto_unbox = TRUE)

write_json(occurrences_export,
           file.path(out_dir, "occurrences.json"),
           pretty = TRUE,
           auto_unbox = TRUE)

write_json(dictionary,
           file.path(out_dir, "dictionary.json"),
           pretty = TRUE, auto_unbox = TRUE)

write_json(stats,
           file.path(out_dir, "stats.json"),
           pretty = TRUE, auto_unbox = TRUE)

############################################################
# UPLOAD TO WORDPRESS
############################################################

upload_file <- function(local, remote_file) {
  
  host_clean <- config$ftp$host %>%
    str_replace("^ftp://", "") %>%   # enlève ftp://
    str_replace("/$", "")            # enlève slash final
  
  url <- paste0(
    "ftp://",
    config$ftp$user, ":",
    config$ftp$pass, "@",
    host_clean,
    "/",
    config$paths$remote_base,
    "/",
    remote_file
  )
  
  message("[UPLOAD] ", remote_file)
  message("[URL] ", url)
  
  curl::curl_upload(local, url)
}

files <- c(
  "sites.json",
  "occurrences.json",
  "dictionary.json",
  "taxonomy.json",
  "stats.json"
)

purrr::walk(files, function(f) {
  upload_file(
    file.path(out_dir, f),
    f
  )
})

############################################################
# FLUSH CACHE
############################################################

httr::POST(
  WP_FLUSH_URL,
  httr::add_headers(`x-vectobol-token` = WP_TOKEN)
)

cat("✔ VECTOBOL PIPELINE COMPLETE\n")