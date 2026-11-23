<?php
get_header();
?>

<main class="vb-page">

  <!-- HERO -->
  <section class="vb-hero vb-card">
    <h1 id="species_header" class="vb-title"></h1>
    <div id="vb-species-message" class="vb-species-message" role="status" aria-live="polite" hidden></div>
    <div id="species_meta" class="vb-meta"></div>
  </section>

  <!-- GRID -->
  <section class="vb-grid">

    <!-- LEFT -->
    <div class="vb-col vb-main">

      <div class="vb-card">
        <h2 id="label_systematique" data-label="systematique">Systématique</h2>
        <div id="txt_systematique" data-i18n="systematics"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_bio_ecologie" data-label="bioecologie">Bioécologie</h2>
        <div id="txt_bio_ecologie" data-i18n="bioecology"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_pathogenes" data-label="pathogenes">Pathogènes</h2>
        <div id="txt_pathogenes" data-i18n="pathogens"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_distribution" data-label="distribution">Distribution</h2>
        <div id="txt_distribution" data-i18n="distribution"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_bolivie" data-label="bolivie">En Bolivie...</h2>
        <div id="txt_bolivie" data-i18n="bolivia"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_bibliographie" data-label="bibliographie">Bibliographie</h2>
        <div id="txt_bibliographie" data-i18n="bibliography"></div>
      </div>

    </div>

    <!-- RIGHT -->
    <aside class="vb-col vb-side">

      <div class="vb-card vb-sticky">
        <h2 id="label_photos" data-label="photos">Photos</h2>
        <div id="photo_band" class="vb-photo-band"></div>
      </div>

      <div class="vb-card vb-sticky">
        <h2 id="label_collectes" data-label="collectes">Cartographie</h2>
        <div id="vb-map"></div>
        <div id="vb-status" class="vb-map-status" role="status" aria-live="polite"></div>
      </div>

    </aside>

  </section>

</main>

<?php get_footer(); ?>