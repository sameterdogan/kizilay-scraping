const cheerio = require("cheerio")
const axios = require("axios")
const fs = require('fs');
const request = require('request');
const slugify = require("slugify");
async function performScraping() {


    try {
        // downloading the target web page
        // by performing an HTTP GET request in Axios
        const posts=[];
        const payload={
            pageNum: 1,
            count: 10,
            haberKategori:3
        }
        const baseUrl="https://www.kizilay.org.tr";

        const axiosResponse = await axios.post(`https://www.kizilay.org.tr/Haber/HaberListe`,payload,{
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
            }
        })

        const $ = cheerio.load(axiosResponse.data)


        const promises = $(".item-box").map(async (index,item)=>{
            const post={};
            const pageUrl = $(item).find(".item-hover").attr("href");
            //dış sayfadan alınan bilgiler
            post['thumbnail']=$(item).find(".img-responsive").attr("src");
            post['title']=$(item).find(".item-box-desc h4 a").html();
            post['date']=$(item).find(".item-box-desc small").html();
            post['thumbnail']=baseUrl+post['thumbnail'];


            // iç sayfa isteği
            const axiosResponseInnerPage = await axios.request({
                method: "GET",
                url: `${baseUrl}${pageUrl}`,
            })
            const $innerPage = cheerio.load(axiosResponseInnerPage.data)
            post['preview']=baseUrl+$innerPage(".col-md-9 .img-responsive.pb-10").attr("src");
           //içerik
            post["content"] = $innerPage(".clearfix.mt-30 + p").html();

            const folderName = 'images';
            if (!fs.existsSync(folderName)) {
                fs.mkdirSync(folderName);
            }



            //gallery
             post['gallery']=[];
             $innerPage(".masonry-gallery .image-hover img").each((index,item)=>{
                      let url= baseUrl+$innerPage(item).attr("src");
                     let slug = slugify(post.title, {        replacement: '-', remove: /[*+~.()?'"!:@#]/g, lower: true, })
                     request(url).pipe(fs.createWriteStream(`./${folderName}/${slug}-image-${index}.png`));
                  post.gallery.push(url);
             });


              posts.push(post);
        })
        await Promise.all(promises);

        console.log(posts)
    }catch (e){
        console.log(e)
    }
}




performScraping()
