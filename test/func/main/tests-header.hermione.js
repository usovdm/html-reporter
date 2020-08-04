describe('descr', () => {
    it('test1', function() {
        return this.browser
            .url('/')
            // .foo('ss')
            .then(() => {
                assert.equal(1, 2);
            });
        // .assertView('plain-1', '.js-header-wrapper');
    });
});

// describe('descr2', () => {
//     it('test2', function() {
//         return this.browser
//             .url('')
//             .assertView('plain-1', '.js-header-wrapper');
//     });
// });

// describe('Test header', function() {
//     it('should show tests summary', function() {
//         return this.browser
//             .url('')
//             .waitForVisible('.summary')
//             .assertView('summary', '.summary', {ignoreElements: ['.summary__value']});
//     });

//     it('should add date to report', function() {
//         return this.browser
//             .url('')
//             .waitForVisible('.header__date');
//     });
// });
