// routes/selfRoutes.js
import express from 'express';
import {logger} from "../util/logger.js";
import axios from 'axios';

const pageId = '<Your Page ID Goes Here>';
const accessToken = '<Your Access Token Goes Here>';
const router = express.Router();


const deletePostById = async (postId) => {
    postId = postId.toString().indexOf('_') == -1?
        postId.replace(pageId,`${pageId}_`):postId;
    logger.log(postId);
    try {
        const response = await axios.delete(
            `https://graph.facebook.com/v17.0/${postId}`,{
                params: {
                    access_token: accessToken,
                }
            }
        );
        if (response.status === 200) {
            console.log('Post deleted successfully.');
            return true;
        } else {
            console.log('Failed to delete post:', response.data);
            return false;
        }
    } catch (error) {
        console.error('Error deleting post:', error.response.data.error.message);
        return false;
    }
};
const postToFacebook = async (message,link) => {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/me/feed`,
            {
                message: message,
                link:link,
                access_token: accessToken,
            }
        );

        return response.data.id;
    } catch (error) {
        console.error('Error posting to Facebook:', error.response.data.error.message);
    }
};

const getPostsAtPageIndex = async (pageIndex, limit) => {
    let posts = [];
    let hasNextPage = true;
    let afterCursor = '';

    while (hasNextPage && posts.length <= limit * (pageIndex + 1)) {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/v17.0/${pageId}/posts`,
                {
                    params: {
                        access_token: accessToken,
                        after: afterCursor,
                        fields:'message,id,insights.metric(post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total),attachments{unshimmed_url}'
                    }
                }
            );
            const newPosts = response.data.data;
            posts = [...posts, ...newPosts];
            // Update the after cursor for the next page
            if (response.data.paging && response.data.paging.next) {
                const afterParam = new URLSearchParams(response.data.paging.cursors.after).toString();
                afterCursor = afterParam ? `after=${afterParam}` : '';
            } else {
                hasNextPage = false;
            }
        } catch (error) {
            console.error('Error fetching posts:', error.response.data.error.message);
            hasNextPage = false;
        }
    }

    // Calculate the range of posts for the target page index
    const startIndex = limit * pageIndex;
    const endIndex = Math.min(limit * (pageIndex + 1), posts.length);
    let fb_posts = [];
    // Print the posts at the specified page index
    for (let i = startIndex; i < endIndex; i++) {
        let post_reactions = getInsightValueByKey(posts[i].insights,'post_reactions_by_type_total');
        let post = {
            id :parseInt(posts[i].id.split('_')[1]),
            externalReferenceCode:posts[i].id,
            message:posts[i].message || posts[i].story,
            createdTime:posts[i].created_time,
            link:getAttachmentLink(posts[i].attachments) || "",
            impressions : getInsightValueByKey(posts[i].insights,'post_impressions'),
            engagedUsers : getInsightValueByKey(posts[i].insights,'post_engaged_users'),
            clicks : getInsightValueByKey(posts[i].insights,'post_clicks'),
            like : post_reactions.like | 0,
            love : post_reactions.love| 0,
            wow : post_reactions.wow| 0,
            haha : post_reactions.haha| 0,
            sorry : post_reactions.sorry| 0,
            anger : post_reactions.anger| 0,
        }
        fb_posts.push(post);
    }
    return fb_posts;

};
const getPostById = async (postId) => {
    postId = postId.toString().indexOf('_') == -1?
        postId.replace(pageId,`${pageId}_`):postId;
    logger.log(postId);
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v17.0/${postId}`,
            {
                params: {
                    access_token: accessToken,
                    fields:'message,id,insights.metric(post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total),attachments{unshimmed_url}'
                }
            }
        );
        const post = response.data;
        let post_reactions = getInsightValueByKey(post.insights,'post_reactions_by_type_total');
        let postData = {
            id :parseInt(post.id.split('_')[1]),
            externalReferenceCode:post.id.replace('_',''),
            message:post.message || post.story,
            createdTime:post.created_time,
            link:getAttachmentLink(post.attachments) || "",
            impressions : getInsightValueByKey(post.insights,'post_impressions'),
            engagedUsers : getInsightValueByKey(post.insights,'post_engaged_users'),
            clicks : getInsightValueByKey(post.insights,'post_clicks'),
            like : post_reactions.like | 0,
            love : post_reactions.love| 0,
            wow : post_reactions.wow| 0,
            haha : post_reactions.haha| 0,
            sorry : post_reactions.sorry| 0,
            anger : post_reactions.anger| 0,
        }
        return postData;

    } catch (error) {
        console.error('Error fetching post:', error.response.data.error.message);
    }
};
function getInsightValueByKey(insightsObject,insightKey)
{
    return insightsObject.data.find(insight=>insight.name == insightKey).values[0].value;
}
function getAttachmentLink(attachmentObject)
{
    return attachmentObject && attachmentObject.data ? attachmentObject.data[0].unshimmed_url : "";
}

router.get('/',async(req,res)=>{
    res.send('READY');
});
router.get('/:objectDefinitionExternalReferenceCode',async(req,res)=>{
    const { companyId, languageId, scopeKey,userId,page,pageSize } = req.query;
    let result = await getPostsAtPageIndex(page-1,pageSize);
    let resultPage = {
        items : result,
        page:page,
        totalCount:result.length,
        pageSize:pageSize
    }
    res.status(200).json(resultPage);
});
router.post('/:objectDefinitionExternalReferenceCode',async(req,res)=>{
    let {companyId,languageId,scopeKey,userId,objectEntry} = req.body;
    let newObjId = await postToFacebook(objectEntry.message,objectEntry.link);
    objectEntry["id"] = newObjId.split('_')[1];
    objectEntry["externalReferenceCode"] = newObjId;
    res.status(200).json(objectEntry);
});
router.get('/:objectDefinitionExternalReferenceCode/:externalReferenceCode',async(req,res)=>{
    const { companyId, languageId, scopeKey,userId,page,pageSize } = req.query;
    let externalReferenceCode = req.params.externalReferenceCode;
    let postData = await getPostById(externalReferenceCode);
    res.status(200).json(postData);
});
router.put('/:objectDefinitionExternalReferenceCode/:externalReferenceCode',async(req,res)=>{
    let {companyId,languageId,scopeKey,userId,objectEntry} = req.body;
    let objectId = req.params.externalReferenceCode;
    console.log(objectId);
    let deleteFlag = await deletePostById(objectId);
    if (deleteFlag)
    {
        let newObjectId = await postToFacebook(objectEntry.message,objectEntry.link);
        objectEntry["id"] = newObjectId.split('_')[1];
        objectEntry["externalReferenceCode"] = newObjectId;
        res.status(200).json(objectEntry);
    }else
    {
        res.status(500);
    }
});
router.delete('/:objectDefinitionExternalReferenceCode/:externalReferenceCode',async(req,res)=>{
    let {companyId,languageId,scopeKey,userId,objectEntry} = req.body;
    let objectId = req.params.externalReferenceCode;
    await deletePostById(objectId);
    res.status(200).json(objectId);
});
export default router;
