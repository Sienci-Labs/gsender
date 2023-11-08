## Important Notes
### Connection Issues
- sometimes the hover will not work. if you notice the test waiting for something and then failing when trying to connect, it's most likely the hover glitching.
- if this happens, hover over the connection bar yourself or retry the test until it works
- i am not sure what causes this glitch, whether it is our issue or the function's

## Setup
- start your server
- `npm run cypress:open`
- choose E2E
- choose your browser

## API:
**https://docs.cypress.io/api/table-of-contents**
- most common functions:
    - `cy.visit` => visit a webpage. if no url is specified, uses `baseUrl` in `cypress.config.json`
    - `cy.get` => find an element by id or class
    - `cy.contains` => find an element by the value it contains (ex. `cy.contains('Save')` to get a button with the text 'Save')
    - `cy.should` => make an assertion
    - `cy.wait` => wait for a certain number of milliseconds
- you can find by class by using `.`, and by id by using `#` (ex. `cy.get('#myid')` or `cy.get('.myclass')`)