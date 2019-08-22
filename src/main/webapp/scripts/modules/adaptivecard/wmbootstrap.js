$.ready = function() {
    var homePage = _WM_APP_PROPERTIES.homePage;

    function getCardName() {
        var hash = location.hash;
        if (hash.length > 0) {
            return hash.substring(2);
        }
        return homePage;
    }

    function renderCard() {
        var cardName = getCardName();
        $.get('services/adaptivecards/' + cardName, function (response) {
            var adaptiveCard = new AdaptiveCards.AdaptiveCard();
            adaptiveCard.parse(JSON.parse(response));
            var renderedCard = adaptiveCard.render();
            $('#card-container').empty().append(renderedCard);
        });
    }

    window.addEventListener("hashchange", renderCard, false);
    renderCard();
};