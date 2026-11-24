<?php
/**
 * Template Name: VECTOBOL – Fiche espèce
 * Template Post Type: page
 *
 * Modèle WordPress natif pour les pages génériques de fiches espèces.
 * La sidebar reste entièrement gérée par OceanWP.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();

do_action( 'ocean_before_content_wrap' );
?>

<div id="content-wrap" class="container clr">

    <?php do_action( 'ocean_before_primary' ); ?>

    <div id="primary" class="content-area clr">

        <?php do_action( 'ocean_before_content' ); ?>

        <div id="content" class="site-content clr">

            <?php do_action( 'ocean_before_content_inner' ); ?>

            <?php while ( have_posts() ) : the_post(); ?>

                <article id="post-<?php the_ID(); ?>" <?php post_class( 'single-page-article clr' ); ?>>

                    <div class="entry clr" <?php oceanwp_schema_markup( 'entry_content' ); ?>>

                        <?php do_action( 'ocean_before_page_entry' ); ?>

                        <main id="vb-species-page" class="vb-species-page">

                            <header class="vb-species-header">
                                <h1 id="species_header" class="vb-species-title"></h1>

                                <div
                                    id="vb-species-message"
                                    class="vb-species-message"
                                    role="status"
                                    aria-live="polite"
                                    hidden
                                ></div>

                                <div id="species_meta" class="vb-meta"></div>
                            </header>

                            <div class="vb-grid" hidden>

                                <section class="vb-card vb-species-section">
                                    <h2 id="label_systematique" data-label="systematique">Systématique</h2>
                                    <div id="txt_systematique" data-i18n="systematics"></div>
                                </section>

                                <section class="vb-card vb-species-section">
                                    <h2 id="label_bio_ecologie" data-label="bioecologie">Bioécologie</h2>
                                    <div id="txt_bio_ecologie" data-i18n="bioecology"></div>
                                </section>

                                <section class="vb-card vb-species-section">
                                    <h2 id="label_pathogenes" data-label="pathogenes">Pathogènes</h2>
                                    <div id="txt_pathogenes" data-i18n="pathogens"></div>
                                </section>

                                <section class="vb-card vb-species-section">
                                    <h2 id="label_distribution" data-label="distribution">Distribution</h2>
                                    <div id="txt_distribution" data-i18n="distribution"></div>
                                </section>

                                <section class="vb-card vb-species-section">
                                    <h2 id="label_bolivie" data-label="bolivie">En Bolivie...</h2>
                                    <div id="txt_bolivie" data-i18n="bolivia"></div>
                                </section>

                                <section class="vb-card vb-species-section vb-species-media">
                                    <h2 id="label_photos" data-label="photos">Photos</h2>
                                    <div id="photo_band" class="vb-photo-band"></div>
                                </section>

                                <section class="vb-card vb-species-section vb-species-map">
                                    <h2 id="label_collectes" data-label="collectes">Cartographie</h2>
                                    <div id="vb-map"></div>
                                    <div id="vb-status" class="vb-map-status" role="status" aria-live="polite"></div>
                                </section>

                                <section class="vb-card vb-species-section">
                                    <h2 id="label_bibliographie" data-label="bibliographie">Bibliographie</h2>
                                    <div id="txt_bibliographie" data-i18n="bibliography"></div>
                                </section>

                            </div>

                        </main>

                        <?php do_action( 'ocean_after_page_entry' ); ?>

                    </div>

                </article>

            <?php endwhile; ?>

            <?php do_action( 'ocean_after_content_inner' ); ?>

        </div>

        <?php do_action( 'ocean_after_content' ); ?>

    </div>

    <?php do_action( 'ocean_after_primary' ); ?>

</div>

<?php
do_action( 'ocean_after_content_wrap' );

get_footer();
