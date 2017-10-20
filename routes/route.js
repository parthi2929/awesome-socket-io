exports.index = function(request, response)
{
    response.render(
        "index",
        {
            title: "Simple Socket IO",
            headline: "Welcome to Simple Socket IO"
        }
    );
}