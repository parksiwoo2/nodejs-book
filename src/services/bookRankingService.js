const Book = require('../models/bookModel');

function getPeriodStart(period) {
  const now = new Date();

  if (period === 'daily') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return start;
  }

  if (period === 'monthly') {
    const start = new Date(now);
    start.setMonth(now.getMonth() - 1);
    return start;
  }

  return null;
}

async function getBookRanking(period = 'all', page = 1, limit = 10) {
  const validPeriods = ['daily', 'weekly', 'monthly', 'all'];

  if (!validPeriods.includes(period)) {
    throw new Error('period는 daily, weekly, monthly, all 중 하나여야 합니다.');
  }

  const parsedPage = Math.max(Number(page) || 1, 1);
  const parsedLimit = Math.max(Number(limit) || 10, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const periodStart = getPeriodStart(period);

  const commentProjectStage = periodStart
    ? {
        filteredComments: {
          $filter: {
            input: { $ifNull: ['$book.comments', []] },
            as: 'comment',
            cond: {
              $gte: ['$$comment.createdDt', periodStart]
            }
          }
        }
      }
    : {
        filteredComments: {
          $ifNull: ['$book.comments', []]
        }
      };

  const rankings = await Book.aggregate([
    {
      $lookup: {
        from: 'rooms',
        let: { bookId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$book._id', '$$bookId']
              }
            }
          },
          {
            $group: {
              _id: null,
              roomCount: {
                $sum: 1
              },
              totalRoomMemberCount: {
                $sum: {
                  $ifNull: ['$memberCount', 0]
                }
              }
            }
          }
        ],
        as: 'roomStats'
      }
    },
    {
      $lookup: {
        from: 'bookreports',
        let: { bookId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$book._id', '$$bookId']
              }
            }
          },
          {
            $project: commentProjectStage
          },
          {
            $group: {
              _id: null,
              totalCommentCount: {
                $sum: {
                  $size: '$filteredComments'
                }
              }
            }
          }
        ],
        as: 'commentStats'
      }
    },
    {
      $addFields: {
        roomCount: {
          $ifNull: [
            {
              $arrayElemAt: ['$roomStats.roomCount', 0]
            },
            0
          ]
        },
        totalRoomMemberCount: {
          $ifNull: [
            {
              $arrayElemAt: ['$roomStats.totalRoomMemberCount', 0]
            },
            0
          ]
        },
        totalCommentCount: {
          $ifNull: [
            {
              $arrayElemAt: ['$commentStats.totalCommentCount', 0]
            },
            0
          ]
        }
      }
    },
    {
      $addFields: {
        rankingScore: {
          $add: [
            {
              $multiply: ['$totalRoomMemberCount', 3]
            },
            {
              $multiply: ['$totalCommentCount', 1]
            }
          ]
        }
      }
    },
    {
      $sort: {
        rankingScore: -1,
        totalRoomMemberCount: -1,
        totalCommentCount: -1,
        roomCount: -1,
        createdAt: -1
      }
    },
    {
      $skip: skip
    },
    {
      $limit: parsedLimit
    },
    {
      $project: {
        roomStats: 0,
        commentStats: 0
      }
    }
  ]);

  const totalCount = await Book.countDocuments();

  return {
    period,
    page: parsedPage,
    limit: parsedLimit,
    totalCount,
    rankings: rankings.map((book, index) => ({
      rank: skip + index + 1,
      id: book._id,
      title: book.title,
      author: book.author,
      roomCount: book.roomCount,
      totalRoomMemberCount: book.totalRoomMemberCount,
      totalCommentCount: book.totalCommentCount,
      rankingScore: book.rankingScore
    }))
  };
}

module.exports = {
  getBookRanking
};