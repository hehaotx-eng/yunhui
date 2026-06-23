const jobService = require('./services/job/service');
const { jobToFeedItem } = require('./services/core/feed-engine');

async function test() {
  try {
    console.log('=== 测试搜索数据流 ===\n');
    
    console.log('1. jobService.searchJobs("前端"):');
    const searchResult = await jobService.searchJobs({ keyword: '前端', page: 1, limit: 5 });
    console.log('   结果数量:', searchResult.list.length);
    if (searchResult.list.length > 0) {
      const job = searchResult.list[0];
      console.log('   第一个job:');
      console.log('     job_id:', job.job_id);
      console.log('     title:', job.title);
      console.log('     company_name:', job.company_name);
      console.log('     location:', job.location);
    }
    
    console.log('\n2. jobToFeedItem 转换:');
    if (searchResult.list.length > 0) {
      const feedItem = jobToFeedItem(searchResult.list[0]);
      console.log('   feed item:');
      console.log('     id:', feedItem.id);
      console.log('     type:', feedItem.type);
      console.log('     title:', feedItem.title);
      console.log('     subtitle:', feedItem.subtitle);
      console.log('     payload.title:', feedItem.payload.title);
      console.log('     payload.job_id:', feedItem.payload.job_id);
    }
    
  } catch (e) {
    console.error('错误:', e.message);
    console.error(e.stack);
  }
  process.exit(0);
}

test();