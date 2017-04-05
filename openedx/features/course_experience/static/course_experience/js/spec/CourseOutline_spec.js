/* globals Logger, loadFixtures */

import constants from 'edx-ui-toolkit/src/js/utils/constants';

import CourseOutline from '../CourseOutline';

describe('Course outline factory', () => {
  describe('keyboard listener', () => {
    const triggerKeyListener = (current, destination, keyCode) => {
      current.focus();
      spyOn(destination, 'focus');

      document.querySelector('.block-tree').dispatchEvent(
        new KeyboardEvent({
          key: keyCode,
          target: current,
        }),
      );
    };

    // Our block IDs are invalid DOM selectors unless we first escape `:` and `@`
    const escapeIds = idObj => Object.assign({}, ...Object.entries(idObj).map(([key, value]) => ({
      [key]: value.replace(/@/g, '\\@').replace(/:/, '\\:'),
    })));

    const outlineIds = escapeIds({
      homeworkLabsAndDemos: 'a#block-v1:edX+DemoX+Demo_Course+type@sequential+block@graded_simulations',
      homeworkEssays: 'a#block-v1:edX+DemoX+Demo_Course+type@sequential+block@175e76c4951144a29d46211361266e0e',
      lesson3BeSocial: 'a#block-v1:edX+DemoX+Demo_Course+type@sequential+block@48ecb924d7fe4b66a230137626bfa93e',
      exampleWeek3BeSocial: 'li#block-v1:edX+DemoX+Demo_Course+type@chapter+block@social_integration',
    });

    beforeEach(() => {
      loadFixtures('course_experience/fixtures/course-outline-fragment.html');
      const outline = new CourseOutline('.block-tree');
      outline.init();
    });

    describe('when the down arrow is pressed', () => {
      it('moves focus from a subsection to the next subsection in the outline', () => {
        const current = document.querySelector(outlineIds.homeworkLabsAndDemos);
        const destination = document.querySelector(outlineIds.homeworkEssays);

        triggerKeyListener(current, destination, constants.keyCodes.down);

        expect(destination.focus).toHaveBeenCalled();
      });

      it('moves focus to the subsection list if at the top of a section', () => {
        const current = document.querySelector(outlineIds.exampleWeek3BeSocial);
        const destination = document.querySelector(`${outlineIds.exampleWeek3BeSocial} > ol`);

        triggerKeyListener(current, destination, constants.keyCodes.down);

        expect(destination.focus).toHaveBeenCalled();
      });

      it('moves focus to the next section if on the last subsection', () => {
        const current = document.querySelector(outlineIds.homeworkEssays);
        const destination = document.querySelector(outlineIds.exampleWeek3BeSocial);

        triggerKeyListener(current, destination, constants.keyCodes.down);

        expect(destination.focus).toHaveBeenCalled();
      });
    });

    describe('when the up arrow is pressed', () => {
      it('moves focus from a subsection to the previous subsection in the outline', () => {
        const current = document.querySelector(outlineIds.homeworkEssays);
        const destination = document.querySelector(outlineIds.homeworkLabsAndDemos);

        triggerKeyListener(current, destination, constants.keyCodes.up);

        expect(destination.focus).toHaveBeenCalled();
      });

      it('moves focus to the section list if at the first subsection', () => {
        const current = document.querySelector(outlineIds.lesson3BeSocial);
        const destination = document.querySelector(`${outlineIds.exampleWeek3BeSocial} > ol`);

        triggerKeyListener(current, destination, constants.keyCodes.up);

        expect(destination.focus).toHaveBeenCalled();
      });

      it('moves focus last subsection of the previous section if at a section boundary', () => {
        const current = document.querySelector(outlineIds.exampleWeek3BeSocial);
        const destination = document.querySelector(outlineIds.homeworkEssays);

        triggerKeyListener(current, destination, constants.keyCodes.up);

        expect(destination.focus).toHaveBeenCalled();
      });
    });
  });

  describe('eventing', () => {
    beforeEach(() => {
      loadFixtures('course_experience/fixtures/course-outline-fragment.html');
      const outline = new CourseOutline('.block-tree');
      outline.init();
      spyOn(Logger, 'log');
    });

    it('sends an event when an outline section is clicked', () => {
      $('a.focusable:contains("Homework - Labs and Demos")').click();

      expect(Logger.log).toHaveBeenCalledWith('edx.ui.lms.link_clicked', {
        target_url: `${window.location.origin}/courses/course-v1:edX+DemoX+Demo_Course/jump_to/block-v1:edX+DemoX+Demo_Course+type@sequential+block@graded_simulations`,
        current_url: window.location.toString(),
      });
    });
  });
});
