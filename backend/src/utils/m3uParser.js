const fs = require('fs');
const parser = require('iptv-playlist-parser');

/**
 * Parse M3U file and extract channel information
 * Handles common M3U formatting errors and skips empty lines
 * @param {string} filePath - Path to the M3U file
 * @returns {Array} - Array of parsed channel objects
 */
const parseM3UFile = (filePath) => {
  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Parse using iptv-playlist-parser
    const result = parser.parse(content);
    
    // Transform to our channel format
    const channels = result.items.map((item, index) => {
      // Extract group title from group attribute or group-title
      const groupTitle = item.group?.title || 
                        item.groupTitle || 
                        item.raw?.match(/group-title="([^"]*)"/)?.[1] ||
                        'Uncategorized';
      
      // Extract TVG attributes
      const tvgId = item.tvg?.id || null;
      const tvgName = item.tvg?.name || null;
      const logo = item.tvg?.logo || 
                   item.logo || 
                   item.raw?.match(/tvg-logo="([^"]*)"/)?.[1] ||
                   null;
      
      // Extract country and language if available
      const country = item.tvg?.country || 
                      item.raw?.match(/tvg-country="([^"]*)"/)?.[1] ||
                      '';
      
      const language = item.tvg?.language || 
                       item.raw?.match(/tvg-language="([^"]*)"/)?.[1] ||
                       '';

      return {
        id: `temp-${index}`,
        name: item.name || 'Unknown Channel',
        streamUrl: item.url || '',
        category: groupTitle,
        logo: logo,
        groupTitle: groupTitle,
        tvgId: tvgId,
        tvgName: tvgName,
        country: country,
        language: language,
        duration: item.duration || -1,
        raw: item.raw || ''
      };
    });

    // Filter out channels with empty stream URLs
    const validChannels = channels.filter(channel => {
      return channel.streamUrl && 
             channel.streamUrl.trim() !== '' && 
             (channel.streamUrl.startsWith('http://') || 
              channel.streamUrl.startsWith('https://') ||
              channel.streamUrl.startsWith('rtmp://') ||
              channel.streamUrl.startsWith('rtsp://'));
    });

    return {
      success: true,
      channels: validChannels,
      totalFound: channels.length,
      validChannels: validChannels.length,
      categories: [...new Set(validChannels.map(c => c.category))]
    };

  } catch (error) {
    console.error('M3U Parse Error:', error);
    return {
      success: false,
      error: error.message,
      channels: []
    };
  }
};

/**
 * Alternative custom parser for malformed M3U files
 * Uses regex to handle common formatting errors
 * @param {string} filePath - Path to the M3U file
 * @returns {Array} - Array of parsed channel objects
 */
const parseM3UFileCustom = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const channels = [];
    let currentChannel = null;
    let lineNumber = 0;

    for (let line of lines) {
      lineNumber++;
      line = line.trim();
      
      // Skip empty lines and comments (except #EXTINF)
      if (!line || (line.startsWith('#') && !line.startsWith('#EXTINF'))) {
        continue;
      }

      // Parse #EXTINF line
      if (line.startsWith('#EXTINF')) {
        currentChannel = {
          id: `temp-${channels.length}`,
          duration: -1,
          name: '',
          category: 'Uncategorized',
          logo: null,
          tvgId: null,
          tvgName: null,
          country: '',
          language: '',
          raw: line
        };

        // Extract duration
        const durationMatch = line.match(/#EXTINF:\s*(-?\d+)/);
        if (durationMatch) {
          currentChannel.duration = parseInt(durationMatch[1]);
        }

        // Extract tvg-name
        const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
        if (tvgNameMatch) {
          currentChannel.tvgName = tvgNameMatch[1];
        }

        // Extract tvg-id
        const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
        if (tvgIdMatch) {
          currentChannel.tvgId = tvgIdMatch[1];
        }

        // Extract tvg-logo
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        if (logoMatch) {
          currentChannel.logo = logoMatch[1];
        }

        // Extract group-title
        const groupMatch = line.match(/group-title="([^"]*)"/);
        if (groupMatch) {
          currentChannel.category = groupMatch[1];
          currentChannel.groupTitle = groupMatch[1];
        }

        // Extract tvg-country
        const countryMatch = line.match(/tvg-country="([^"]*)"/);
        if (countryMatch) {
          currentChannel.country = countryMatch[1];
        }

        // Extract tvg-language
        const languageMatch = line.match(/tvg-language="([^"]*)"/);
        if (languageMatch) {
          currentChannel.language = languageMatch[1];
        }

        // Extract channel name (after the last comma)
        const nameMatch = line.match(/,\s*(.+)$/);
        if (nameMatch) {
          currentChannel.name = nameMatch[1].trim();
        } else if (currentChannel.tvgName) {
          currentChannel.name = currentChannel.tvgName;
        } else {
          currentChannel.name = `Channel ${channels.length + 1}`;
        }
      }

      // Parse URL line (must be a valid URL)
      else if (currentChannel && 
               (line.startsWith('http://') || 
                line.startsWith('https://') || 
                line.startsWith('rtmp://') || 
                line.startsWith('rtsp://'))) {
        currentChannel.streamUrl = line;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }

    return {
      success: true,
      channels: channels,
      totalFound: channels.length,
      validChannels: channels.length,
      categories: [...new Set(channels.map(c => c.category))]
    };

  } catch (error) {
    console.error('Custom M3U Parse Error:', error);
    return {
      success: false,
      error: error.message,
      channels: []
    };
  }
};

/**
 * Clean up uploaded file after parsing
 * @param {string} filePath - Path to the file to delete
 */
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('File cleanup error:', error);
  }
};

module.exports = {
  parseM3UFile,
  parseM3UFileCustom,
  cleanupFile
};
