var body = document.getElementsByClassName('vscode-body')[0];

var mainContainer = document.createElement('div');
mainContainer.classList.add('mainContainer');
mainContainer.classList.add('has-top-padding');
mainContainer.classList.add('uhf-container');
mainContainer.classList.add('content');
mainContainer.innerHTML = `<div class="columns has-large-gaps is-gapless-mobile">
<section class="primary-holder column is-two-thirds-tablet is-three-quarters-desktop">
<div class="columns is-gapless-mobile has-large-gaps">
<div id="main-column" class="column  is-full is-8-desktop">
</div>
<div class="font-size-sm right-container column is-4-desktop display-none display-block-desktop" data-bi-name="pageactions" role="complementary" aria-label="Page Actions">

							<div id="affixed-right-container" class="doc-outline is-vertically-scrollable" style="width: 356.75px; top: 164.5px; bottom: 24px; position: fixed;">
</div>
</section>
</div>`;
// Move the body's children into this wrapper
while (body.firstChild) {
	mainContainer.querySelector('#main-column').appendChild(body.firstChild);
}

// Append the wrapper to the body
document.body.appendChild(mainContainer);
body.setAttribute('class', 'theme-light');
