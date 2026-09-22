<?php
get_header();
?>

<main class="vb-page">

  <!-- HERO -->
  <section class="vb-hero vb-card">
    <h1 id="species_header" class="vb-title"></h1>
    <div id="species_meta" class="vb-meta"></div>
  </section>

  <!-- GRID -->
  <section class="vb-grid">

    <!-- LEFT -->
    <div class="vb-col vb-main">

      <div class="vb-card">
        <h2 id="label_systematique"></h2>
        <div id="txt_systematique"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_bio_ecologie"></h2>
        <div id="txt_bio_ecologie"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_pathogenes"></h2>
        <div id="txt_pathogenes"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_distribution"></h2>
        <div id="txt_distribution"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_bolivie"></h2>
        <div id="txt_bolivie"></div>
      </div>

      <div class="vb-card">
        <h2 id="label_bibliographie"></h2>
        <div id="txt_bibliographie"></div>
      </div>

    </div>

    <!-- RIGHT -->
    <aside class="vb-col vb-side">

      <div class="vb-card vb-sticky">
        <h2 id="label_photos">Photos</h2>
        <div id="photo_band" class="vb-photo-band"></div>
      </div>

      <div class="vb-card vb-sticky">
        <h2 id="label_collectes">Collectes</h2>
        <div id="map"></div>
      </div>

    </aside>

  </section>

</main>

<?php get_footer(); ?>