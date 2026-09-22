library(jsonlite)
library(dplyr)
library(stringr)
library(readr)
library(httr)
library(curl)
library(tidyr)

# =========================
# CONFIGURATION
# =========================

INPUT_DIR <- "data/input"

BASE_DIR <- "data/vectobol/production"
ECO_DIR  <- file.path(BASE_DIR, "ecology")

# ⚠️ OVH PATH (souvent /www/)
REMOTE_BASE <- "vectobol/wp-content/data/vectobol/production"
REMOTE_ECO  <- paste0(REMOTE_BASE, "/ecology")

# OVH SSH (SFTP)
FTP_HOST <- "ssh.cluster1xxxxxxxx"
FTP_USER <- "ecoscxxxxxxxx"
FTP_PASS <- "InsectBoliVxxxxxxxx"

# WP CACHE FLUSH
WP_TOKEN <- "VECTOBOL_TOKEN_7f3c9a2d_9xxxxxxxxxxxxxx"
WP_FLUSH_URL <- "https://vectobol.ecosciences.fr/wp-json/vectobol/v1/flush-cache"

dir.create(ECO_DIR, recursive = TRUE, showWarnings = FALSE)

# =========================
# UTILS
# =========================

safe_txt <- function(x) ifelse(is.na(x), "", x)


upload_file <- function(local, remote) {
  
  url <- paste0(
    "ftp://ftp.cluster100.hosting.ovh.net/",
    remote
  )
  
  curl::curl_upload(
    local,
    url,
    username = FTP_USER,
    password = FTP_PASS
  )
  
  cat("✔ Uploaded:", remote, "\n")
}



flush_cache <- function() {
  
  res <- httr::POST(
    url = WP_FLUSH_URL,
    httr::add_headers(
      `x-vectobol-token` = WP_TOKEN
    )
  )
  
  cat("\n--- WP CACHE FLUSH ---\n")
  cat("Status:", res$status_code, "\n")
  cat(httr::content(res, "text", encoding = "UTF-8"), "\n")
  cat("----------------------\n\n")
}

# =========================
# LOAD DATA
# =========================

df <- read_csv(file.path(INPUT_DIR, "master_species.csv"),
               show_col_types = FALSE)

df <- df %>%
  mutate(across(where(is.character), ~str_trim(ifelse(is.na(.), "", .))))

# =========================
# KEY
# =========================

df <- df %>%
  mutate(
    species_key = paste0(str_to_lower(genus), "_", str_to_lower(species)),
    slug = gsub("_", "-", species_key)
  )

if (any(duplicated(df$species_key))) {
  stop("Duplicate species_key detected")
}

# =========================
# HAS ECOLOGY (CORRIGÉ)
# =========================

fields_ecology <- c(
  "systematics_fr","systematics_en","systematics_es",
  "bioecology_fr","bioecology_en","bioecology_es",
  "pathogens_fr","pathogens_en","pathogens_es",
  "distribution_fr","distribution_en","distribution_es",
  "bolivia_fr","bolivia_en","bolivia_es",
  "bibliography"
)

has_ecology_fn <- function(row) {
  
  any(vapply(fields_ecology, function(f) {
    
    x <- row[[f]]
    
    !is.na(x) &&
      nzchar(trimws(as.character(x)))
    
  }, logical(1)))
  
}

# calcul vectorisé propre (UNE seule fois)
df$has_ecology <- apply(df, 1, function(r) {
  has_ecology_fn(as.list(r))
})

# contrôle (important pour debug)
cat("\nHAS_ECOLOGY SUMMARY:\n")
print(table(df$has_ecology, useNA = "ifany"))





# =========================
# TAXO STRUCTURED
# =========================

taxonomy <- lapply(seq_len(nrow(df)), function(i) {
  
  row <- df[i, ]
  
  list(
    key = row$species_key,
    slug = row$slug,
    has_ecology = isTRUE(row$has_ecology),
    
    taxonomy = list(
      phylum = row$phyllum,
      class = row$class,
      order = row$order,
      family = row$family,
      subfamily = row$subfamily,
      tribe = row$tribe,
      genus = row$genus,
      subgenus = if (row$subgenus == "") NA else row$subgenus,
      species = row$species
    ),
    
    authority = list(
      author = row$author,
      year = suppressWarnings(as.numeric(row$year)),
      parentheses = tolower(row$author_parentheses) == "true"
    )
  )
  
})

# =========================
# WRITE FILES LOCALLY
# =========================
write_json(
  taxonomy,
  file.path(BASE_DIR, "taxonomy.json"),
  pretty = TRUE,
  auto_unbox = TRUE
)


index <- df %>%
  transmute(
    key = species_key,
    file = paste0("ecology/", species_key, ".json"),
    family, subfamily, tribe, genus,
    redaction,
    update
  )

write_json(
  index,
  file.path(BASE_DIR, "ecology_index.json"),
  pretty = TRUE, auto_unbox = TRUE
)

# =========================
# ECOLOGY FILES
# =========================

for (i in seq_len(nrow(df))) {
  
  row <- df[i, ]
  key <- row$species_key
  
  ecology <- list(
    key = key,
    slug = row$slug,
    has_ecology = isTRUE(row$has_ecology),
    
    redaction = safe_txt(row$redaction),
    update = safe_txt(row$update),
    
    systematics_fr = safe_txt(row$systematics_fr),
    systematics_en = safe_txt(row$systematics_en),
    systematics_es = safe_txt(row$systematics_es),
    
    bioecology_fr = safe_txt(row$bioecology_fr),
    bioecology_en = safe_txt(row$bioecology_en),
    bioecology_es = safe_txt(row$bioecology_es),
    
    pathogens_fr = safe_txt(row$pathogens_fr),
    pathogens_en = safe_txt(row$pathogens_en),
    pathogens_es = safe_txt(row$pathogens_es),
    
    distribution_fr = safe_txt(row$distribution_fr),
    distribution_en = safe_txt(row$distribution_en),
    distribution_es = safe_txt(row$distribution_es),
    
    bolivia_fr = safe_txt(row$bolivia_fr),
    bolivia_en = safe_txt(row$bolivia_en),
    bolivia_es = safe_txt(row$bolivia_es),
    
    bibliography = safe_txt(row$bibliography),
    
    vectobol_presence = row$vectobol_presence,
    nb_occurrences = row$nb_occurrences,
    images = row$images,
    map_image = row$map_image
  )
  
  write_json(
    ecology,
    file.path(ECO_DIR, paste0(key, ".json")),
    pretty = TRUE, auto_unbox = TRUE
  )
}

# =========================
# UPLOAD SEQUENCE
# =========================

cat("\n=== UPLOAD START ===\n")

upload_file(
  file.path(BASE_DIR, "taxonomy.json"),
  paste0(REMOTE_BASE, "/taxonomy.json")
)

upload_file(file.path(BASE_DIR, "ecology_index.json"),
            paste0(REMOTE_BASE, "/ecology_index.json"))

ecology_files <- list.files(ECO_DIR, full.names = TRUE)

for (f in ecology_files) {
  upload_file(f, paste0(REMOTE_ECO, "/", basename(f)))
}

cat("\n=== UPLOAD DONE ===\n")

# =========================
# WP CACHE FLUSH (ONLY ONCE)
# =========================

flush_cache()

cat("✔ ALL DONE\n")