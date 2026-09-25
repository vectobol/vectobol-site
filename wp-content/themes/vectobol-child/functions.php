<?php

define('VECTOBOL_CACHE_VERSION', 'v1');


/* =========================================================
   1. CONTEXT DETECTION
========================================================= */
function vb_is_species_template() {
    return !empty($_GET['species']);
}

function vb_is_list_page() {

    // adapte ici si tu as d'autres pages liste
    return is_page([
        'les-especes',
        'las-especies',
        'the-species',
    
        'reduviidae-fr',
        'reduviidae-es',
        'reduviidae-en',

        'anophelinae-fr',
        'anophelinae-es',
        'anophelinae-en',

        'aedes-fr',
        'aedes-es',
        'aedes-en'

    ]);
}

/* pour letheme enfant */
add_action('wp_enqueue_scripts', function () {

    wp_enqueue_style(
        'vectobol-child-style',
        get_stylesheet_uri(),
        array('oceanwp-style'),
        wp_get_theme()->get('Version')
    );

});





/* =========================================================
   2. LIST PIPELINE (TABLE TAXO)
========================================================= */
add_action('wp_enqueue_scripts', function () {

    if (!vb_is_list_page()) return;

    /* =========================
       CSS — LISTE DES ESPÈCES
    ========================= */

    $css_path = get_stylesheet_directory() . '/css/taxonomy-list.css';

    if (file_exists($css_path)) {

        wp_enqueue_style(
            'vectobol-list',
            get_stylesheet_directory_uri() . '/css/taxonomy-list.css',
            ['vectobol-child-style'],
            filemtime($css_path)
        );

    }


    /* =========================
       JS — LISTE DES ESPÈCES
    ========================= */

    $js_path = get_stylesheet_directory() . '/js/list/index.js';

    wp_enqueue_script(
        'vectobol-list',
        get_stylesheet_directory_uri() . '/js/list/index.js',
        [],
        file_exists($js_path) ? filemtime($js_path) : null,
        true
    );

});


/* =========================================================
   3. SPECIES PIPELINE (?species=xxx)
========================================================= */
add_action('wp_enqueue_scripts', function () {

    if (!vb_is_species_template()) return;

    $js_path = get_stylesheet_directory() . '/js/species/index.js';

    wp_enqueue_script(
        'vectobol-species',
        get_stylesheet_directory_uri() . '/js/species/index.js',
        [],
        file_exists($js_path) ? filemtime($js_path) : null,
        true
    );
});


/* =========================================================
   4. OCCURRENCES PIPELINE
========================================================= */

function vb_is_occurrences_page() {

    $slug = get_post_field(
        'post_name',
        get_queried_object_id()
    );

    if (!$slug) return false;

    return in_array(
        $slug,
        [
            'carte-interactive',
            'mapa-interactiva',
            'map-vectobol'
        ],
        true
    );
}


add_action('wp_enqueue_scripts', function () {

    if (!vb_is_occurrences_page()) return;

    /* =========================
       CSS — OCCURRENCES
    ========================= */

    $css_path =
        get_stylesheet_directory() .
        '/css/occurrences.css';

    if (file_exists($css_path)) {

        wp_enqueue_style(
            'vectobol-occurrences',
            get_stylesheet_directory_uri() .
            '/css/occurrences.css',
            ['vectobol-child-style'],
            filemtime($css_path)
        );

    }


    /* =========================
       LEAFLET
    ========================= */

    wp_enqueue_style(
        'leaflet',
        'https://unpkg.com/leaflet/dist/leaflet.css',
        [],
        null
    );

    wp_enqueue_style(
        'leaflet-markercluster',
        'https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css',
        ['leaflet'],
        null
    );

    wp_enqueue_style(
        'leaflet-markercluster-default',
        'https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css',
        ['leaflet-markercluster'],
        null
    );


    wp_enqueue_script(
        'leaflet',
        'https://unpkg.com/leaflet/dist/leaflet.js',
        [],
        null,
        true
    );

    wp_enqueue_script(
        'leaflet-markercluster',
        'https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js',
        ['leaflet'],
        null,
        true
    );


    /* =========================
       JS — OCCURRENCES
    ========================= */

    $js_path =
        get_stylesheet_directory() .
        '/js/occurrences/index.js';

    wp_enqueue_script(
        'vectobol-occurrences',
        get_stylesheet_directory_uri() .
        '/js/occurrences/index.js',
        ['leaflet-markercluster'],
        file_exists($js_path) ? filemtime($js_path) : null,
        true
    );

});



/* =========================================================
   5. MODULE SUPPORT (ES MODULES)
========================================================= */
add_filter('script_loader_tag', function ($tag, $handle, $src) {

    $modules = [
        'vectobol-list',
        'vectobol-species',
        'vectobol-collaborators',
        'vectobol-occurrences'
    ];

    if (in_array($handle, $modules)) {
        return '<script type="module" src="' . esc_url($src) . '"></script>';
    }

    return $tag;

}, 10, 3);


/* =========================================================
   6. REST API (UNCHANGED)
========================================================= */
add_action('rest_api_init', function () {

    register_rest_route('vectobol/v1', '/taxa', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',

        'callback' => function () {

            global $wpdb;

            $taxa_table = $wpdb->prefix . 'vb_taxa';
            $content_table = $wpdb->prefix . 'vb_species_content';

            $rows = $wpdb->get_results(

                "
                SELECT
                    t.taxon_key,
                    t.slug,

                    t.phylum,
                    t.class,
                    t.order_name,
                    t.family,
                    t.subfamily,
                    t.tribe,
                    t.genus,
                    t.subgenus,
                    t.species,

                    t.author,
                    t.year,
                    t.author_parentheses,

                    sc.id AS content_id,
                    sc.status_fr,
                    sc.status_en,
                    sc.status_es

                FROM $taxa_table AS t

                LEFT JOIN $content_table AS sc
                    ON t.id = sc.taxon_id

                WHERE t.is_active = 1

                ORDER BY
                    t.family ASC,
                    t.subfamily ASC,
                    t.genus ASC,
                    t.species ASC
                ",

                ARRAY_A

            );

            $taxa = [];

            foreach ($rows as $row) {

                $taxa[] = [

                    'key' =>
                        $row['taxon_key'],

                    'slug' =>
                        $row['slug'],

                    /*
                    * Une fiche existe réellement
                    * si une ligne existe dans vb_species_content.
                    */

                    'has_ecology' =>
                        !empty($row['content_id']),

                    /*
                    * Taxonomie
                    */

                    'phylum' =>
                        $row['phylum'] ?? '',

                    'class' =>
                        $row['class'] ?? '',

                    'order' =>
                        $row['order_name'] ?? '',

                    'family' =>
                        $row['family'] ?? '',

                    'subfamily' =>
                        $row['subfamily'] ?? '',

                    'tribe' =>
                        $row['tribe'] ?? '',

                    'genus' =>
                        $row['genus'] ?? '',

                    'subgenus' =>
                        $row['subgenus'] ?? '',

                    'species' =>
                        $row['species'] ?? '',

                    /*
                    * Autorité
                    */

                    'author' =>
                        $row['author'] ?? '',

                    'year' =>
                        $row['year'] ?? '',

                    'author_parentheses' =>
                        (bool) $row['author_parentheses'],

                    /*
                    * Statuts de la fiche
                    * (pour utilisation ultérieure)
                    */

                    'status_fr' =>
                        $row['status_fr'] ?? null,

                    'status_en' =>
                        $row['status_en'] ?? null,

                    'status_es' =>
                        $row['status_es'] ?? null

                ];

            }

            return rest_ensure_response($taxa);

        }
    ]);




    register_rest_route('vectobol/v1', '/species', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {

            $file = WP_CONTENT_DIR . '/data/vectobol/production/taxo_structured.json';

            if (!file_exists($file)) {
                return new WP_Error('no_file', 'taxo_structured.json missing', ['status' => 404]);
            }

            return json_decode(file_get_contents($file), true);
        }
    ]);


    register_rest_route('vectobol/v1', '/ecology/(?P<species>[a-z0-9_-]+)', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function ($request) {

            $species = sanitize_key($request['species']);
            $file = WP_CONTENT_DIR . "/data/vectobol/production/ecology/{$species}.json";

            if (!file_exists($file)) {
                return new WP_Error('not_found', 'Species not found', ['status' => 404]);
            }

            return json_decode(file_get_contents($file), true);
        }
    ]);


    /* =========================================================
        SPECIES DATA FROM SQL
        ========================================================= */

        register_rest_route('vectobol/v1', '/species/(?P<species>[a-z0-9_-]+)', [
            'methods' => 'GET',
            'permission_callback' => '__return_true',

            'callback' => function ($request) {

                global $wpdb;

                $species_key = sanitize_key($request['species']);

                if (empty($species_key)) {
                    return new WP_Error(
                        'invalid_species',
                        'Invalid species key',
                        ['status' => 400]
                    );
                }


                /* =================================================
                TABLES
                ================================================= */

                $taxa_table = $wpdb->prefix . 'vb_taxa';
                $content_table = $wpdb->prefix . 'vb_species_content';


                /* =================================================
                TAXON + SPECIES CONTENT
                ================================================= */

                $sql = $wpdb->prepare(

                    "
                    SELECT

                        /* TAXONOMY */

                        t.id AS taxon_id,
                        t.taxon_key,
                        t.slug,

                        t.phylum,
                        t.class,
                        t.order_name,
                        t.family,
                        t.subfamily,
                        t.tribe,

                        t.genus,
                        t.subgenus,
                        t.species,

                        /* AUTHORITY */

                        t.author,
                        t.year,
                        t.author_parentheses,

                        /* SPECIES CONTENT */

                        s.sheet_author,

                        s.status_fr,
                        s.status_en,
                        s.status_es,

                        s.systematics_fr,
                        s.systematics_en,
                        s.systematics_es,

                        s.bioecology_fr,
                        s.bioecology_en,
                        s.bioecology_es,

                        s.pathogens_fr,
                        s.pathogens_en,
                        s.pathogens_es,

                        s.distribution_fr,
                        s.distribution_en,
                        s.distribution_es,

                        s.bolivia_fr,
                        s.bolivia_en,
                        s.bolivia_es,

                        s.bibliography,

                        s.systematics_updated_at,
                        s.bioecology_updated_at,
                        s.pathogens_updated_at,
                        s.distribution_updated_at,
                        s.bolivia_updated_at,
                        s.bibliography_updated_at

                    FROM $taxa_table AS t

                    LEFT JOIN $content_table AS s
                        ON s.taxon_id = t.id

                    WHERE t.taxon_key = %s

                    LIMIT 1
                    ",

                    $species_key

                );


                $row = $wpdb->get_row(
                    $sql,
                    ARRAY_A
                );


                /* =================================================
                SPECIES NOT FOUND
                ================================================= */

                if (!$row) {

                    return new WP_Error(
                        'not_found',
                        'Species not found',
                        ['status' => 404]
                    );

                }


                /* =================================================
                RETURN STRUCTURE
                ================================================= */

                return [

                    'key' => $row['taxon_key'],

                    'slug' => $row['slug'],


                    /* =============================================
                    TAXONOMY
                    ============================================= */

                    'taxonomy' => [

                        'phylum' =>
                            $row['phylum'],

                        'class' =>
                            $row['class'],

                        'order' =>
                            $row['order_name'],

                        'family' =>
                            $row['family'],

                        'subfamily' =>
                            $row['subfamily'],

                        'tribe' =>
                            $row['tribe'],

                        'genus' =>
                            $row['genus'],

                        'subgenus' =>
                            $row['subgenus'],

                        'species' =>
                            $row['species']

                    ],


                    /* =============================================
                    AUTHORITY
                    ============================================= */

                    'authority' => [

                        'author' =>
                            $row['author'],

                        'year' =>
                            $row['year'],

                        'parentheses' =>
                            (bool) $row['author_parentheses']

                    ],


                    /* =============================================
                    SPECIES CONTENT
                    ============================================= */

                    'systematics_fr' =>
                        $row['systematics_fr'] ?? '',

                    'systematics_en' =>
                        $row['systematics_en'] ?? '',

                    'systematics_es' =>
                        $row['systematics_es'] ?? '',


                    'bioecology_fr' =>
                        $row['bioecology_fr'] ?? '',

                    'bioecology_en' =>
                        $row['bioecology_en'] ?? '',

                    'bioecology_es' =>
                        $row['bioecology_es'] ?? '',


                    'pathogens_fr' =>
                        $row['pathogens_fr'] ?? '',

                    'pathogens_en' =>
                        $row['pathogens_en'] ?? '',

                    'pathogens_es' =>
                        $row['pathogens_es'] ?? '',


                    'distribution_fr' =>
                        $row['distribution_fr'] ?? '',

                    'distribution_en' =>
                        $row['distribution_en'] ?? '',

                    'distribution_es' =>
                        $row['distribution_es'] ?? '',


                    'bolivia_fr' =>
                        $row['bolivia_fr'] ?? '',

                    'bolivia_en' =>
                        $row['bolivia_en'] ?? '',

                    'bolivia_es' =>
                        $row['bolivia_es'] ?? '',


                    'bibliography' =>
                        $row['bibliography'] ?? '',


                    /* =============================================
                    META
                    ============================================= */

                    'sheet_author' =>
                        $row['sheet_author'] ?? '',

                    'status_fr' =>
                        $row['status_fr'] ?? 'draft',

                    'status_en' =>
                        $row['status_en'] ?? 'draft',

                    'status_es' =>
                        $row['status_es'] ?? 'draft',


                    'updated_at' => [

                        'systematics' =>
                            $row['systematics_updated_at'],

                        'bioecology' =>
                            $row['bioecology_updated_at'],

                        'pathogens' =>
                            $row['pathogens_updated_at'],

                        'distribution' =>
                            $row['distribution_updated_at'],

                        'bolivia' =>
                            $row['bolivia_updated_at'],

                        'bibliography' =>
                            $row['bibliography_updated_at']

                    ]

                ];

            }

        ]);








     register_rest_route('vectobol/v1', '/collaborators', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {


            global $wpdb;


            $table = $wpdb->prefix . 'vb_collaborators';


            $rows = $wpdb->get_results(

                "
                SELECT
                    nom,
                    prenom,
                    institution,
                    pays,
                    echantillonnage,
                    montage,
                    identification,
                    collection,
                    fiche_espece,
                    maintenance_listes

                FROM $table

                WHERE visible_public = 1

                ORDER BY nom ASC, prenom ASC
                ",

                ARRAY_A

            );


            $collaborators = [];


            foreach ($rows as $row) {


                $collaborators[] = [

                    'nom' => $row['nom'],

                    'prenom' => $row['prenom'],

                    'institution' => $row['institution'],

                    'pays' => $row['pays'],


                    'roles' => [

                        'echantillonnage' =>
                            (bool) $row['echantillonnage'],

                        'montage' =>
                            (bool) $row['montage'],

                        'identification' =>
                            (bool) $row['identification'],

                        'collection' =>
                            (bool) $row['collection'],

                        'fiche_espece' =>
                            (bool) $row['fiche_espece'],

                        'maintenance_listes' =>
                            (bool) $row['maintenance_listes']

                    ]

                ];

            }


            return rest_ensure_response($collaborators);

        }
    ]);



});



/* =========================================================
   VECTOBOL STATS
========================================================= */
add_action('wp_enqueue_scripts', function () {

    wp_enqueue_script('jquery'); // script garanti existant

    wp_add_inline_script(
        'jquery',
        'window.vectobolStatsUrl = ' . json_encode(
            content_url('/data/vectobol/production/stats.json')
        ) . ';',
        'before'
    );

});



/* pur grader les ?genre-espece 
dans les adresse url des fiches especes pour apsser de fr-es-en */
add_filter('pll_the_language_link', function($url) {

    if (isset($_GET['species'])) {
        $url = add_query_arg('species', $_GET['species'], $url);
    }

    return $url;
});


/* =========================================================
   POUR SIDE BAR RECHERCHE D ESPECES
========================================================= */
/* =========================================================
   SIDEBAR + I18N
========================================================= */

add_action('wp_enqueue_scripts', function () {

  if (is_admin()) return;

  wp_enqueue_script(
    'vectobol-i18n',
    get_stylesheet_directory_uri() . '/js/i18n/labels.js',
    [],
    filemtime(get_stylesheet_directory() . '/js/i18n/labels.js'),
    true
  );


  wp_enqueue_script(
    'vectobol-sidebar-ui',
    get_stylesheet_directory_uri() . '/js/sidebar/sidebar-ui.js',
    ['vectobol-i18n'],
    filemtime(get_stylesheet_directory() . '/js/sidebar/sidebar-ui.js'),
    true
    );

    /* pour gerer les liens sur les pages dans sidebar: triatomes (id=9690) , carte interactive (id=7576) anopheles (id=11920)
     et le;flux rss */

    wp_localize_script(
    'vectobol-sidebar-ui',
    'VECTOBOL_LINKS',
    [
        'maps' => function_exists('pll_get_post')
            ? get_permalink(pll_get_post(7576))
            : get_permalink(7576),

        'anopheles' => function_exists('pll_get_post')
            ? get_permalink(pll_get_post(11920))
            : get_permalink(11920),

        'triatomes' => function_exists('pll_get_post')
            ? get_permalink(pll_get_post(9690))
            : get_permalink(9690),

        'rss' => get_feed_link(),
    ]
);


   
        wp_enqueue_script(
            'vectobol-sidebar-species',
            get_stylesheet_directory_uri() . '/js/sidebar/species-search.js',
            ['vectobol-i18n'],
            filemtime(get_stylesheet_directory() . '/js/sidebar/species-search.js'),
            true
        );




});


/* =========================================================
   POUR FENETRE MODALE NEWSLETTER + BREVO + SIDEBAR
========================================================= */

/* =========================================================
   NEWSLETTER MODALE
========================================================= */

add_action('wp_enqueue_scripts', function () {

    wp_enqueue_script(
        'vectobol-newsletter-modal',
        get_stylesheet_directory_uri() . '/js/sidebar/newsletter-modal.js',
        ['vectobol-i18n'],
        filemtime(get_stylesheet_directory() . '/js/sidebar/newsletter-modal.js'),
        true
    );

    
});

/* =========================================================
   MODAL HTML IN FOOTER
========================================================= */

add_action('wp_footer', function () {
    get_template_part('template-parts/newsletter-modal');
});

/* CONNECTION A BREVO AVEC CLE API */
/* ==================================== */

add_action('rest_api_init', function () {

    register_rest_route('newsletter/v1', '/subscribe', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => 'vb_newsletter_subscribe'
    ]);

});

function vb_newsletter_subscribe($request) {

    $params = $request->get_json_params();
    $email = isset($params['email']) ? sanitize_email($params['email']) : '';
    $lang = isset($params['lang'])
        ? strtoupper(sanitize_text_field($params['lang']))
        : 'FR';

    if (!$email || !is_email($email)) {
        return new WP_REST_Response([
            'status' => 'error',
            'code' => 'invalid'
        ], 400);
    }

    // 🔑 BREVO API KEY (à sécurisée via wp-config.php)
    
    $api_key = defined('BREVO_API_KEY') ? BREVO_API_KEY : '';
    if (empty($api_key)) {
        return new WP_REST_Response([
            'status' => 'error',
            'code' => 'missing_api_key'
        ], 500);
    }

    $response = wp_remote_post('https://api.brevo.com/v3/contacts', [
        'headers' => [
            'Content-Type' => 'application/json',
            'api-key' => $api_key
        ],
        'body' => json_encode([
            'email' => $email,

            'listIds' => [7], // ⚠️ ID liste Brevo à adapter

            'attributes' => [
                'LANG' => $lang
            ],

            'updateEnabled' => true
        ])
    ]);

    if (is_wp_error($response)) {
        return new WP_REST_Response([
            'status' => 'error',
            'code' => 'brevo_fail'
        ], 500);
    }

    $code = wp_remote_retrieve_response_code($response);

    if ($code === 201 || $code === 204) {
        return new WP_REST_Response([
            'status' => 'success',
            'code' => 'subscribed'
        ], 200);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);

    // déjà inscrit
    if (!empty($body['code']) && $body['code'] === 'duplicate_parameter') {
        return new WP_REST_Response([
            'status' => 'error',
            'code' => 'already'
        ], 409);
    }

    return new WP_REST_Response([
        'status' => 'error',
        'code' => 'brevo_error',
        'details' => $body
    ], 500);
}

/* =========================================================
   HEADER STICKY
========================================================= */

add_action('wp_enqueue_scripts', function () {

    if (is_admin()) return;

    $js_path = get_stylesheet_directory() . '/js/header-sticky.js';

    if (file_exists($js_path)) {

        wp_enqueue_script(
            'vectobol-header-sticky',
            get_stylesheet_directory_uri() . '/js/header-sticky.js',
            [],
            filemtime($js_path),
            true
        );

    }

});


/* =========================================================
   COLLABORATORS TABLE
   Chargement JS sur la page "À propos" multilingue
========================================================= */

add_action('wp_enqueue_scripts', function () {

    if (!function_exists('pll_get_post')) {
        return;
    }


    $current_id = get_queried_object_id();


    // Vérifie si la page courante appartient au groupe de traduction "À propos"
    $translations = [];

    foreach (['fr', 'es', 'en'] as $lang) {

        $translated_id = pll_get_post($current_id, $lang);

        if ($translated_id) {
            $translations[] = $translated_id;
        }

    }


    if (!in_array($current_id, $translations, true)) {
        return;
    }


    
    // pour dataTable
    wp_enqueue_style(
        'datatables',
        'https://cdn.datatables.net/2.3.4/css/dataTables.dataTables.min.css',
        [],
        '2.3.4'
    );

    wp_enqueue_style(
            'vectobol-collaborators',
            get_stylesheet_directory_uri() . '/css/collaborators.css',
            ['vectobol-child-style'],
            filemtime(
                get_stylesheet_directory() . '/css/collaborators.css'
            )
        );

    wp_enqueue_script(
        'datatables',
        'https://cdn.datatables.net/2.3.4/js/dataTables.min.js',
        [],
        '2.3.4',
        true
    );




    $js_path = get_stylesheet_directory() . '/js/collaborators/index.js';


    wp_enqueue_script(
        'vectobol-collaborators',
        get_stylesheet_directory_uri() . '/js/collaborators/index.js',
        ['datatables'],
        file_exists($js_path) ? filemtime($js_path) : null,
        true
    );


});




