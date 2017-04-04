from lms.djangoapps.course_blocks.api import get_course_blocks
from xmodule.modulestore.django import modulestore
from ..transformer import GradesTransformer


class CourseData(object):
    """
    Houses course data and intelligently gets and caches the
    requested data as long as at least one is provided upon
    initialization.
    """
    def __init__(self, user, course=None, collected_block_structure=None, course_structure=None, course_key=None):
        if not any([course, collected_block_structure, course_structure, course_key]):
            raise AttributeError(
                "You must specify one of course, collected_block_structure, "
                "course_structure, or course_key to this method."
            )
        self.user = user
        self._collected_block_structure = collected_block_structure
        self._structure = course_structure
        self._course = course
        self._course_key = course_key
        self._location = None

    @property
    def course_key(self):
        if not self._course_key:
            self._course_key = self.course.id
        return self._course_key

    @property
    def location(self):
        if not self._location:
            structure = self.effective_structure
            if structure:
                self._location = structure.root_block_usage_key
            else:
                self._location = self.course.location
        return self._location

    @property
    def structure(self):
        if not self._structure:
            self._structure = get_course_blocks(
                self.user,
                self.location,
                collected_block_structure=self._collected_block_structure,
            )
        return self._structure

    @property
    def course(self):
        if not self._course:
            self._course = modulestore().get_course(self.course_key)
        return self._course

    @property
    def grading_policy_hash(self):
        structure = self.effective_structure
        if structure:
            return structure.get_transformer_block_field(
                structure.root_block_usage_key,
                GradesTransformer,
                'grading_policy_hash',
            )
        else:
            return GradesTransformer.grading_policy_hash(self.course)

    @property
    def version(self):
        structure = self.effective_structure
        course_block = structure[self.location] if structure else self.course
        return getattr(course_block, 'course_version', None)

    @property
    def edited_on(self):
        # get course block from structure only; subtree_edited_on field on modulestore's course block isn't optimized.
        course_block = self.structure[self.location]
        return getattr(course_block, 'subtree_edited_on', None)

    @property
    def effective_structure(self):
        return self._structure or self._collected_block_structure

    def __unicode__(self):
        return u'Course: course_key: {}'.format(self.course_key)

    def full_string(self):
        return u'Course: course_key: {}, version: {}, edited_on: {}, grading_policy: {}'.format(
            self.course_key, self.version, self.edited_on, self.grading_policy_hash,
        )
