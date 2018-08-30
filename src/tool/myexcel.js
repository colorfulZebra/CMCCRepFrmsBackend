'use strict';
const LARGE_WEIGHT = 1024;

/**
 * Find all indexes of keywords
 * @param {JSON} sheetJson 
 * @param {Array} keywords 
 */
function indexKeywords (sheetJson, keywords) {
  let keyIndexes = [];
  // Initial index record list
  for (let i = 0; i < keywords.length; i++) {
    keyIndexes.push([]);
  }
  for (let row = 0; row < sheetJson.length; row++) {
    for (let i = 0; i < keywords.length; i++) {
      let tmpidx = sheetJson[row].reduce((ar, el, idx) => {
        if (el === keywords[i]) {
          ar.push({row, col:idx});
        }
        return ar;
      }, []);
      if (tmpidx.length > 0) {
        keyIndexes[i] = keyIndexes[i].concat(tmpidx);
      }
    }
  }
  return keyIndexes;
}

/**
 * Find minimum distance cluster
 * @param {Array} keyIndexes 
 */
function clusterKeywords (keyIndexes) {
  let clusters =  greedyCombine(keyIndexes);
  if (!Array.isArray(clusters[0])) {
    throw '计算关键字相关性出错，请检查关键字是否正确';
  }
  let optNodes = [];
  let optDist = 65536;
  clusters.map( (nd) => {
    let newDist = clusterEucDist(nd);
    if (newDist < optDist) {
      optDist = newDist;
      optNodes = nd;
    }
  });
  return optNodes;
}

/**
 * 
 * @param {JSON} sheetjson 
 * @param {Array} cluster 
 */
function locateResult (sheetjson, cluster) {
  if (!Array.isArray(cluster)) {
    throw '关键字最小类信息错误，请检查关键字';
  } else if (cluster.length < 2) {
    throw '关键字最小类信息错误，请检查关键字';
  } else {
    return { 
      row: cluster[cluster.length - 1].row,
      col: cluster[cluster.length - 2].col,
      val: sheetjson[cluster[cluster.length - 1].row][cluster[cluster.length - 2].col]
    };
  }
}

/**
 * Tool function for clusterKeywords. cross join two list
 * @param {Array} alst 
 * @param {Array} blst 
 */
function cross (alst, blst) {
  if (alst.length === 0 && blst.length > 0) {
    return blst;
  } else if (blst.length === 0 && alst.length > 0) {
    return alst;
  } else {
    let result = [];
    for (let aidx = 0; aidx < alst.length; aidx++) {
      for (let bidx = 0; bidx < blst.length; bidx++) {
        if (Array.isArray(alst[aidx])) {
          result.push(alst[aidx].concat(blst[bidx]));
        } else {
          result.push([alst[aidx]].concat(blst[bidx]));
        }
      }
    }
    return result;
  }
}

/**
 * Tool function for clusterKeywords. All combines of keywords position
 * @param {Array} lst 
 */
function greedyCombine (lst) {
  return lst.reduce((ar, el) => {
    ar = cross(ar, el);
    return ar;
  }, []);
}

/**
 * Tool function for clusterKeywords. Euclid distance of to nodes { row: number, col: number }
 * @param {object} nodex 
 * @param {object} nodey 
 */
function eucDist (nodex, nodey) {
  if (nodex.row === undefined || nodex.col === undefined || nodey.row === undefined || nodey.col === undefined) {
    return NaN;
  } else {
    return Math.sqrt( (nodex.row - nodey.row) * (nodex.row - nodey.row) + (nodex.col - nodey.col) * (nodex.col - nodey.col) );
  }
}

/**
 * Tool function for clusterKeywords. Calculate Euclid distance of node cluster
 * @param {Array} nodeCluster 
 */
function clusterEucDist (nodeCluster) {
  if (!Array.isArray(nodeCluster)) {
    return NaN;
  } else {
    /*
     * If you need all combines
    let nodepairs = nodeCluster.reduce((ar, el, idx) => {
      let taillst = nodeCluster.slice(idx + 1)
      for (let node of taillst) {
        ar.push([el, node])
      }
      return ar
    }, [])
    */
    return nodeCluster.reduce((tt, el, idx) => {
      let taillst = nodeCluster.slice(idx + 1);
      if (taillst.length === 2) {         // 倒数第三关键字应该是列头的父标题，因此列号小于等于倒数第二关键字列号
        let colkeyidx = taillst[0];
        let rowkeyidx = taillst[1];
        if (colkeyidx.col < el.col) {
          tt += LARGE_WEIGHT;
          tt += eucDist(el, rowkeyidx);
        } else {
          tt += eucDist(el, colkeyidx);
          tt += eucDist(el, rowkeyidx);
        }
      } else if (taillst.length === 1) {   // 最后一个关键字必须是行头，倒数第二个关键字必须是列头，因此行号大于倒数第二关键字，列号小于倒数第二关键字
        let rowkeyidx = taillst[0];
        if (rowkeyidx.row <= el.row || rowkeyidx.col >= el.col) {
          tt += LARGE_WEIGHT;
        } else {
          tt += eucDist(rowkeyidx, el);
        }
        taillst[0];
      } else {
        for (let node of taillst) {
          tt += eucDist(node, el);
        }
      }
      return tt;
    }, 0);
  }
}

/**
 * 
 * @param {JSON} sheetJson
 * @param {String} keywords 
 */
module.exports = function (sheetJson, keywords) {
  let seekKeywords = keywords.split(' ');
  return new Promise ((resolve, reject) => {
    try {
      let keyindexes = indexKeywords(sheetJson, seekKeywords);
      let minEucCluster = clusterKeywords(keyindexes);
      let result = locateResult(sheetJson, minEucCluster);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

