import sharpService from 'astro/assets/services/sharp';
import { baseService } from 'astro/assets';
import sharp from 'sharp';
import { SOCIAL_HEIGHT, SOCIAL_WIDTH } from './meta.js';

// Astro maps fit:contain to Sharp's inside resize, which does not create a fixed-size canvas.
// Only social previews use a padded canvas. Page images retain Astro's normal transforms.
/** @type {import('astro').LocalImageService} */
const service = {
  ...sharpService,
  propertiesToHash: [...baseService.propertiesToHash, 'socialPreview'],
  getURL(options, config) {
    const url = sharpService.getURL(options, config);
    return options.socialPreview ? `${url}&socialPreview=1` : url;
  },
  parseURL(url, config) {
    const options = sharpService.parseURL(url, config);
    return options
      ? { ...options, socialPreview: url.searchParams.get('socialPreview') === '1' }
      : undefined;
  },
  async transform(input, options, config, logger) {
    if (!options.socialPreview) return sharpService.transform(input, options, config, logger);
    const data = await sharp(input)
      .rotate()
      .resize(SOCIAL_WIDTH, SOCIAL_HEIGHT, { fit: 'contain', background: '#140a1f' })
      .flatten({ background: '#140a1f' })
      .jpeg({ quality: 85 })
      .toBuffer();
    return { data, format: 'jpg' };
  },
};

export default service;
