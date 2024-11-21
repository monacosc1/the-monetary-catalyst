export default {
  config: {
    // ... other config options
    editor: {
      enabled: true,
      config: {
        toolbar: {
          items: [
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'code',
            'link',
            '|',
            'bulletedList',
            'numberedList',
            '|',
            'media',
            'blockquote',
            '|',
            'undo',
            'redo'
          ],
        },
      },
    },
  },
  bootstrap() {},
}; 